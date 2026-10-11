import { TaggingPanel } from "components/TaggingPanel"
import { TimelinePanel } from "components/TimelinePanel"
import type { Action } from "components/TimelinePanel/types"
import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useRef, useState } from "react"

import {
  addLabel,
  deleteAction,
  exportActionsToCSV,
  getActions,
  getYoutubeVideoId,
  loadTimelineForVideo,
  saveTimelineForVideo,
  startAction,
  stopAction
} from "./lib/actionsManager"

export const config: PlasmoContentScript = {
  matches: ["https://www.youtube.com/*"]
}

// スタイル要素を作成する関数
const createStyle = (cssText: string): HTMLStyleElement => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getStyle = () => createStyle(cssText)

// ネットワークエラー監視のための設定
let networkErrorCount = 0
let videoPlaybackErrorCount = 0
const NETWORK_ERROR_THRESHOLD = 10 // 閾値を上げる
const VIDEO_ERROR_THRESHOLD = 3 // 動画エラーの閾値

// 完全に無視すべきドメイン（YouTubeの内部システム）
const ignoredNetworkDomains = [
  "googleads.g.doubleclick.net",
  "googlesyndication.com",
  "google-analytics.com",
  "googletagmanager.com",
  "accounts.youtube.com",
  "pagead/viewthroughconversion",
  "doubleclick.net"
]

// 無視すべきエラーメッセージパターン
const ignoredErrorMessages = [
  "CORS policy",
  "frame-ancestors",
  "Content Security Policy",
  "Access to fetch",
  "requestStorageAccessFor",
  "Permission denied",
  "viewthroughconversion",
  "pagead"
]

// 動画本体のエラーかどうかを判定
const isVideoPlaybackError = (url: string): boolean => {
  return (
    url.includes("googlevideo.com/videoplayback") &&
    !url.includes("pagead") &&
    !url.includes("ads")
  )
}

// ネットワークエラーをフィルタリングする関数
const shouldIgnoreNetworkError = (url: string, message?: string): boolean => {
  // 動画本体のエラーは無視しない
  if (isVideoPlaybackError(url)) {
    return false
  }

  // ドメインベースのフィルタリング
  const domainIgnored = ignoredNetworkDomains.some((domain) =>
    url.includes(domain)
  )

  // メッセージベースのフィルタリング
  const messageIgnored = message
    ? ignoredErrorMessages.some((pattern) => message.includes(pattern))
    : false

  return domainIgnored || messageIgnored
}

// コンソールエラーを監視してフィルタリング
const originalConsoleError = console.error
console.error = function (...args) {
  const message = args.join(" ")

  // YouTubeの内部エラー（広告、アナリティクス等）をフィルタリング
  if (shouldIgnoreNetworkError("", message)) {
    // 完全に無視（ログも出力しない）
    return
  }

  // 動画本体のエラーのみを拡張機能のエラーとして扱う
  if (message.includes("googlevideo.com") && message.includes("403")) {
    videoPlaybackErrorCount++
    console.warn("[YouCoder] 動画再生403エラーを検出:", message)
  }

  // その他の重要なエラーのみログ出力
  originalConsoleError.apply(console, args)
}

// 動画の状態をチェックする関数
const checkVideoStatus = () => {
  const video = document.querySelector("video") as HTMLVideoElement
  if (!video) {
    return {
      hasVideo: false,
      isReady: false,
      error: "動画要素が見つかりません"
    }
  }

  const networkState = video.networkState
  const readyState = video.readyState

  if (networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    return {
      hasVideo: true,
      isReady: false,
      error: "動画ソースが利用できません (403エラーの可能性)"
    }
  }

  if (readyState < HTMLMediaElement.HAVE_METADATA) {
    return {
      hasVideo: true,
      isReady: false,
      error: "動画メタデータの読み込み中"
    }
  }

  return { hasVideo: true, isReady: true, error: null }
}

const MainContent: React.FC = () => {
  // 現在アクティブなアクションのセット。
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())

  // 現在のページが動画ページかどうかを判定。
  const [isVideoPage, setIsVideoPage] = useState<boolean>(
    window.location.pathname.startsWith("/watch")
  )

  // チーム名のリスト。
  const [teams, setTeams] = useState<string[]>([])

  // ボタンセットのリスト。
  const [buttonSets, setButtonSets] = useState<any[]>([])

  // 選択されたボタンセット。
  const [selectedButtonSet, setSelectedButtonSet] = useState<string | null>(
    null
  )

  // タイムラインに関連付けられたアクション。
  const [timelineActions, setTimelineActions] = useState<Action[]>([])

  // 現在アクティブなラベルのセット。
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())

  // 拡張機能の表示状態。
  const [showExtension, setShowExtension] = useState<boolean>(true)

  // 動画エラー状態の監視
  const [videoError, setVideoError] = useState<string | null>(null)

  const [storageError, setStorageError] = useState<string | null>(null)
  const operationPending = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const uiGeneration = useRef(0)
  const displayedVideoId = useRef<string | null>(null)
  const storageErrors = useRef(new Map<string, string>())
  const syncTimelineUI = (
    videoTimeline: Action[],
    videoId = getYoutubeVideoId()
  ) => {
    displayedVideoId.current = videoId
    setTimelineActions(videoTimeline)
    const inProgress = new Set(
      videoTimeline
        .filter((item) => item.end === undefined)
        .map((item) => `${item.team}_${item.action}`)
    )
    setActiveActions(inProgress)
    setSelectedActions(new Set(inProgress))
  }

  useEffect(() => {
    let disposed = false
    let observedVideoId: string | null | undefined
    const sync = async () => {
      const videoId = getYoutubeVideoId()
      const request = ++uiGeneration.current
      if (videoId !== observedVideoId) {
        observedVideoId = videoId
        setStorageError(
          videoId ? storageErrors.current.get(videoId) || null : null
        )
        syncTimelineUI([], null)
        setActiveLabels(new Set())
      }
      setIsVideoPage(!!videoId)
      try {
        await loadTimelineForVideo(videoId)
        if (
          !disposed &&
          request === uiGeneration.current &&
          videoId === getYoutubeVideoId()
        ) {
          syncTimelineUI(getActions())
          setStorageError(
            videoId ? storageErrors.current.get(videoId) || null : null
          )
        }
      } catch {
        if (!disposed && request === uiGeneration.current)
          setStorageError(
            "記録を読み込めませんでした。再読み込みして再試行してください。"
          )
      }
    }
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      const videoId = getYoutubeVideoId()
      if (
        area === "local" &&
        (changes[`youCoder.timeline.${videoId}`] || changes.timelines)
      )
        void sync()
    }
    const timer = setInterval(() => {
      if (observedVideoId !== getYoutubeVideoId()) void sync()
    }, 500)
    document.addEventListener("yt-navigate-finish", sync)
    chrome.storage.onChanged.addListener(onStorage)
    void sync()
    return () => {
      disposed = true
      clearInterval(timer)
      document.removeEventListener("yt-navigate-finish", sync)
      chrome.storage.onChanged.removeListener(onStorage)
    }
  }, [])

  // 動画エラー監視のuseEffect
  useEffect(() => {
    if (!isVideoPage) return

    const monitorVideo = () => {
      const videoStatus = checkVideoStatus()

      if (!videoStatus.hasVideo) {
        setVideoError("動画要素が見つかりません")
        return
      }

      if (videoStatus.error) {
        // 動画本体の403エラーのみを検知（広告やアナリティクスエラーは除外）
        if (videoStatus.error.includes("403")) {
          const video = document.querySelector("video") as HTMLVideoElement
          if (
            video &&
            video.currentSrc &&
            isVideoPlaybackError(video.currentSrc)
          ) {
            setVideoError("動画へのアクセスが拒否されました (403 Forbidden)")
            console.error(
              "[YouCoder] 動画本体の403エラー検出: 動画にアクセスできません"
            )

            // 実際の動画再生エラーの場合のみユーザーに通知
            setTimeout(() => {
              alert(
                "[YouCoder] 動画再生エラー\n\nYouTube動画へのアクセスが拒否されました (403 Forbidden)。\n\n考えられる原因:\n• 動画が非公開または削除済み\n• 地域制限がかかっている\n• 年齢制限がある\n• ネットワーク接続の問題\n\nページを更新するか、別の動画でお試しください。"
              )
            }, 1000)
          }
        } else if (!videoStatus.error.includes("メタデータ")) {
          // メタデータ読み込み中以外のエラーのみ表示
          setVideoError(videoStatus.error)
          console.warn(`[YouCoder] 動画状態エラー: ${videoStatus.error}`)
        }
      } else {
        setVideoError(null)
      }
    }

    // 初回チェック
    monitorVideo()

    // 定期的にチェック（5秒ごと）
    const interval = setInterval(monitorVideo, 5000)

    // 動画エラーイベントの監視
    const handleVideoError = (event: Event) => {
      const video = event.target as HTMLVideoElement
      const error = video.error

      if (error) {
        // 動画本体のソースエラーのみを処理（広告やアナリティクスエラーは除外）
        if (!video.currentSrc || !isVideoPlaybackError(video.currentSrc)) {
          return // 動画本体以外のエラーは無視
        }

        let errorMessage = "不明なエラーが発生しました"
        let shouldAlert = false

        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "動画の読み込みが中断されました"
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "ネットワークエラーが発生しました"
            shouldAlert = true // ネットワークエラーの場合のみアラート
            videoPlaybackErrorCount++
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "動画のデコードエラーが発生しました"
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "この動画形式はサポートされていません"
            break
        }

        setVideoError(errorMessage)
        console.error("[YouCoder] 動画再生エラー:", errorMessage, error)

        if (shouldAlert && videoPlaybackErrorCount >= VIDEO_ERROR_THRESHOLD) {
          alert(
            `[YouCoder] 動画再生エラー\n\n${errorMessage}\n\n403 Forbiddenエラーや接続の問題が発生している可能性があります。`
          )
          videoPlaybackErrorCount = 0 // リセット
        }
      }
    }

    // 動画要素にエラーリスナーを追加
    const addVideoErrorListener = () => {
      const video = document.querySelector("video")
      if (video) {
        video.addEventListener("error", handleVideoError)
        return () => video.removeEventListener("error", handleVideoError)
      }
      return null
    }

    const cleanup = addVideoErrorListener()

    return () => {
      clearInterval(interval)
      if (cleanup) cleanup()
    }
  }, [isVideoPage])

  // ネットワークエラー監視のuseEffect
  useEffect(() => {
    // Fetch API のエラー監視
    const originalFetch = window.fetch
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args)
        const url = args[0] as string

        if (!response.ok) {
          if (isVideoPlaybackError(url)) {
            // 動画本体のエラーのみ処理
            videoPlaybackErrorCount++
            console.error(
              `[YouCoder] 動画再生エラー: ${response.status} ${response.statusText} - URL: ${url}`
            )

            if (
              response.status === 403 &&
              videoPlaybackErrorCount >= VIDEO_ERROR_THRESHOLD
            ) {
              alert(
                "[YouCoder] 動画再生エラー\n\n動画へのアクセスが拒否されました (403 Forbidden)。\n\nページを更新するか、別の動画でお試しください。"
              )
              videoPlaybackErrorCount = 0
            }
          } else if (!shouldIgnoreNetworkError(url)) {
            // その他の重要でないエラーは静かにカウントのみ
            networkErrorCount++
          }
        }
        return response
      } catch (error) {
        const url = args[0] as string
        if (isVideoPlaybackError(url)) {
          videoPlaybackErrorCount++
          console.error(`[YouCoder] 動画Fetchエラー: ${error} - URL: ${url}`)
        } else if (!shouldIgnoreNetworkError(url)) {
          networkErrorCount++
        }
        throw error
      }
    }

    // XMLHttpRequest のエラー監視
    const originalXHROpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.addEventListener("error", () => {
        if (isVideoPlaybackError(url as string)) {
          videoPlaybackErrorCount++
          console.error(`[YouCoder] 動画XHRエラー: ${method} ${url}`)
        } else if (!shouldIgnoreNetworkError(url as string)) {
          networkErrorCount++
        }
      })

      this.addEventListener("load", () => {
        if (this.status === 403) {
          if (isVideoPlaybackError(url as string)) {
            videoPlaybackErrorCount++
            console.error(`[YouCoder] 動画XHR 403エラー: ${method} ${url}`)
          }
        }
      })

      return originalXHROpen.call(this, method, url, ...rest)
    }

    // 定期的にエラー数をリセット
    const errorResetInterval = setInterval(() => {
      if (networkErrorCount > 0) {
        console.log(
          `[YouCoder] ネットワークエラー数をリセット: ${networkErrorCount}件`
        )
        networkErrorCount = 0
      }
      if (videoPlaybackErrorCount > 0) {
        console.log(
          `[YouCoder] 動画エラー数をリセット: ${videoPlaybackErrorCount}件`
        )
        videoPlaybackErrorCount = 0
      }
    }, 60000) // 1分ごとにリセット

    return () => {
      // クリーンアップ
      window.fetch = originalFetch
      XMLHttpRequest.prototype.open = originalXHROpen
      clearInterval(errorResetInterval)
    }
  }, [])

  useEffect(() => {
    // ローカルストレージからデータを読み込みます。
    const loadData = async () => {
      try {
        const result = await chrome.storage.local.get([
          "teams",
          "buttonSets",
          "selectedButtonSet"
        ])

        if (result.teams) setTeams(result.teams)
        if (result.buttonSets) {
          setButtonSets(result.buttonSets)
        }
        if (result.selectedButtonSet) {
          setSelectedButtonSet(result.selectedButtonSet)
        } else if (result.buttonSets && result.buttonSets.length > 0) {
          setSelectedButtonSet(result.buttonSets[0].setName)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    // ストレージの変更を監視します。
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.teams?.newValue) setTeams(changes.teams.newValue)
        if (changes.buttonSets?.newValue)
          setButtonSets(changes.buttonSets.newValue)
        if (changes.selectedButtonSet?.newValue)
          setSelectedButtonSet(changes.selectedButtonSet.newValue)
        if (changes.showExtension?.newValue !== undefined)
          setShowExtension(changes.showExtension.newValue)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  useEffect(() => {
    // 拡張機能の表示設定を読み込みます。
    const loadSetting = async () => {
      try {
        const data = await chrome.storage.local.get(["showExtension"])
        setShowExtension(
          data.showExtension !== undefined ? data.showExtension : true
        )
      } catch (error) {
        console.error("Failed to load showExtension setting:", error)
      }
    }
    loadSetting()
  }, [])

  useEffect(() => {
    // 拡張機能の可視性に関するメッセージを処理します。
    const handleMessage = (message: any) => {
      if (message.type === "EXTENSION_VISIBILITY_UPDATED") {
        chrome.storage.local.get(["showExtension"]).then((data: any) => {
          setShowExtension(
            data.showExtension !== undefined ? data.showExtension : true
          )
        })
      }
    }
    const runtime = (chrome as any).runtime
    runtime.onMessage.addListener(handleMessage)
    return () => {
      runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  // 新たに選択中のアクションを管理し、ラベル表示を絞り込む
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())

  const runTimelineOperation = async (operation: () => Promise<unknown>) => {
    if (operationPending.current) return
    // The page URL can change before YouTube dispatches its navigation event.
    // Never apply controls/rows still displayed for A to the new video B.
    if (
      !displayedVideoId.current ||
      displayedVideoId.current !== getYoutubeVideoId()
    ) {
      setStorageError(
        "動画を切り替えています。読み込み完了後に再試行してください。"
      )
      return
    }
    operationPending.current = true
    setIsSaving(true)
    const request = ++uiGeneration.current
    const videoId = getYoutubeVideoId()
    if (videoId) storageErrors.current.delete(videoId)
    setStorageError(null)
    try {
      await operation()
      if (request === uiGeneration.current && videoId === getYoutubeVideoId()) {
        // Read latest committed state, including changes from other tabs.
        await loadTimelineForVideo(videoId)
        if (request === uiGeneration.current && videoId === getYoutubeVideoId())
          syncTimelineUI(getActions())
      }
      if (request === uiGeneration.current && videoId === getYoutubeVideoId())
        setStorageError(null)
    } catch {
      const message =
        "保存結果を確認できませんでした。記録内容を確認してから再試行してください。"
      if (videoId) storageErrors.current.set(videoId, message)
      if (videoId === getYoutubeVideoId()) setStorageError(message)
    } finally {
      operationPending.current = false
      setIsSaving(false)
    }
  }
  const handleLabel = (label: string) =>
    runTimelineOperation(async () => {
      const videoId = getYoutubeVideoId()
      const targets = timelineActions.filter((item) => item.end === undefined)
      for (const item of targets) {
        if (videoId !== getYoutubeVideoId()) break
        await addLabel(item.id, label)
      }
    })
  const handleSaveTimeline = () =>
    runTimelineOperation(() => saveTimelineForVideo(getYoutubeVideoId()))

  // 選択中のボタンセットに基づくアクション・ラベルを抽出
  const currentSet = buttonSets.find((set) => set.setName === selectedButtonSet)

  const actions =
    currentSet?.buttons.reduce(
      (acc, btn) => {
        acc[btn.action] = btn.action
        return acc
      },
      {} as Record<string, string>
    ) || {}

  // ラベルのみをサポート - 配列形式は処理しない
  const getLabelsFromButtons = (buttons: any[]): Record<string, string[]> => {
    const labels: Record<string, string[]> = {}

    buttons.forEach((btn) => {
      // Record形式のラベルのみ処理
      if (
        btn.labels &&
        typeof btn.labels === "object" &&
        !Array.isArray(btn.labels)
      ) {
        Object.entries(btn.labels as Record<string, string[]>).forEach(
          ([category, labelList]) => {
            if (!labels[category]) {
              labels[category] = []
            }
            labelList.forEach((label) => {
              if (!labels[category].includes(label)) {
                labels[category].push(label)
              }
            })
          }
        )
      }
    })

    return labels
  }

  // アクティブなアクションに関連するカテゴリ付きラベルのみを取得
  const filteredLabels =
    activeActions.size > 0 // アクションが選択されている場合のみ処理
      ? (() => {
          const selectedButtons =
            buttonSets
              .find((set) => set.setName === selectedButtonSet)
              ?.buttons.filter((btn) => {
                // 同一アクションが複数チームで選択されている場合も考慮
                const actionCount = Array.from(activeActions).filter((key) =>
                  key.endsWith(`_${btn.action}`)
                ).length
                return actionCount > 0 // 1つ以上選択されている場合にラベルを表示
              }) || []

          return getLabelsFromButtons(selectedButtons)
        })()
      : {} // アクションが選択されていない場合は空のオブジェクト

  const handleActionToggle = (team: string, action: string) =>
    runTimelineOperation(async () => {
      const active = timelineActions.find(
        (item) =>
          item.team === team && item.action === action && item.end === undefined
      )
      if (active) await stopAction(active.id)
      else await startAction(team, action)
    })

  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
      {isVideoPage && showExtension && (
        <>
          {videoError && (
            <div
              style={{
                position: "fixed",
                top: "10px",
                right: "10px",
                backgroundColor: "#ff4444",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "12px",
                maxWidth: "300px",
                zIndex: 10000,
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
              }}>
              <strong>[YouCoder] 動画エラー</strong>
              <br />
              {videoError}
            </div>
          )}
          {storageError && (
            <div
              role="alert"
              className="fixed top-12 right-2 z-[10001] max-w-sm rounded bg-red-700 p-3 text-sm text-white">
              {storageError}
            </div>
          )}
          {isSaving && (
            <div
              role="status"
              className="fixed top-2 right-2 z-[10001] rounded bg-white p-2 text-sm text-gray-900">
              記録を保存中…
            </div>
          )}
          <fieldset
            disabled={isSaving}
            aria-busy={isSaving}
            className="m-0 min-w-0 border-0 p-0">
            <TaggingPanel
              teams={teams}
              actions={actions}
              labels={filteredLabels}
              activeActions={activeActions}
              activeLabels={activeLabels}
              onActionToggle={handleActionToggle}
              onLabelClick={handleLabel}
            />
            <TimelinePanel
              actions={timelineActions}
              onDelete={(actionId) => {
                void runTimelineOperation(() => deleteAction(actionId))
              }}
              onSave={handleSaveTimeline}
              onExportCSV={() => exportActionsToCSV(timelineActions)}
            />
          </fieldset>
        </>
      )}
    </div>
  )
}

export default MainContent
