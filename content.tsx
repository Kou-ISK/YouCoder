import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"

import { TaggingPanel } from "~components/TaggingPanel"
import TimelinePanel from "~components/TimelinePanel"

import {
  addLabel,
  getActions,
  loadActionsFromStorage,
  saveTimelineForVideo,
  startAction,
  stopAction
} from "./lib/actionsManager"

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// ネットワークエラー監視のための設定
let networkErrorCount = 0
const NETWORK_ERROR_THRESHOLD = 5 // 5回以上のエラーで警告
const ignoredNetworkDomains = [
  "googleads.g.doubleclick.net",
  "googlesyndication.com",
  "google-analytics.com",
  "googletagmanager.com",
  "googlevideo.com",
  "accounts.youtube.com"
]

// CORSエラーやYouTube内部のエラーをフィルタリング
const ignoredErrorMessages = [
  "CORS policy",
  "frame-ancestors",
  "Content Security Policy",
  "403 (Forbidden)",
  "Access to fetch"
]

// ネットワークエラーをフィルタリングする関数
const shouldIgnoreNetworkError = (url: string, message?: string): boolean => {
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

  // YouTubeの内部エラーをフィルタリング
  if (shouldIgnoreNetworkError("", message)) {
    // 開発環境でのみログ出力（localhostの場合）
    if (window.location.hostname === "localhost") {
      originalConsoleError.call(
        console,
        "[YouCoder] フィルタされたエラー:",
        ...args
      )
    }
    return
  }

  // YouTubeの動画関連エラーのみを拡張機能のエラーとして扱う
  originalConsoleError.apply(console, args)
}

// YouTubeの動画IDを取得する関数。URLのクエリパラメータから"v"を抽出します。
const getYoutubeVideoId = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const videoId = urlParams.get("v")
    if (!videoId) {
      console.warn("[YouCoder] 動画IDが取得できません")
    }
    return videoId
  } catch (error) {
    console.error("[YouCoder] 動画ID取得エラー:", error)
    return null
  }
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
  const [timelineActions, setTimelineActions] = useState(getActions())

  // 現在アクティブなラベルのセット。
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())

  // 拡張機能の表示状態。
  const [showExtension, setShowExtension] = useState<boolean>(true)

  // 動画エラー状態の監視
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    // SPAナビゲーションの変更を監視するためのポーリングメカニズム。
    const timer = setInterval(() => {
      setIsVideoPage(!!getYoutubeVideoId())
    }, 500)
    return () => clearInterval(timer)
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
            video.currentSrc.includes("googlevideo.com")
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
        if (
          !video.currentSrc ||
          !video.currentSrc.includes("googlevideo.com")
        ) {
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

        if (shouldAlert) {
          alert(
            `[YouCoder] 動画再生エラー\n\n${errorMessage}\n\n403 Forbiddenエラーや接続の問題が発生している可能性があります。`
          )
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
    // CORSエラーやその他のネットワークエラーを監視
    const originalFetch = window.fetch
    const originalXHROpen = XMLHttpRequest.prototype.open

    // Fetch API のエラー監視
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args)
        if (!response.ok && !shouldIgnoreNetworkError(args[0] as string)) {
          networkErrorCount++
          console.warn(
            `[YouCoder] ネットワークエラー検出: ${response.status} ${response.statusText} - URL: ${args[0]}`
          )

          if (response.status === 403) {
            console.error(`[YouCoder] 403エラー検出: ${args[0]}`)
          }
        }
        return response
      } catch (error) {
        if (!shouldIgnoreNetworkError(args[0] as string)) {
          networkErrorCount++
          console.warn(`[YouCoder] Fetchエラー: ${error} - URL: ${args[0]}`)
        }
        throw error
      }
    }

    // XMLHttpRequest のエラー監視
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.addEventListener("error", () => {
        if (!shouldIgnoreNetworkError(url as string)) {
          networkErrorCount++
          console.warn(`[YouCoder] XHRエラー: ${method} ${url}`)
        }
      })

      this.addEventListener("load", () => {
        if (this.status === 403 && !shouldIgnoreNetworkError(url as string)) {
          console.error(`[YouCoder] XHR 403エラー: ${method} ${url}`)
        }
      })

      return originalXHROpen.call(this, method, url, ...rest)
    }

    // コンソールエラー監視
    const originalConsoleError = console.error
    console.error = function (...args) {
      const message = args.join(" ")

      // CORSエラーの検出
      if (message.includes("CORS") && message.includes("blocked")) {
        const corsMatch = message.match(/https?:\/\/[^\s]+/)
        if (corsMatch && !shouldIgnoreNetworkError(corsMatch[0])) {
          console.warn("[YouCoder] 重要なCORSエラーが検出されました:", message)
        }
      }

      return originalConsoleError.apply(this, args)
    }

    // 定期的にネットワークエラー数をチェック
    const errorCheckInterval = setInterval(() => {
      if (networkErrorCount >= NETWORK_ERROR_THRESHOLD) {
        console.warn(
          `[YouCoder] 多数のネットワークエラーが検出されました (${networkErrorCount}件)`
        )
        networkErrorCount = 0 // リセット
      }
    }, 30000) // 30秒ごと

    return () => {
      // クリーンアップ
      window.fetch = originalFetch
      XMLHttpRequest.prototype.open = originalXHROpen
      console.error = originalConsoleError
      clearInterval(errorCheckInterval)
    }
  }, [])

  useEffect(() => {
    // YouTubeのナビゲーションイベントを監視します。
    const handleNavigateFinish = () => {
      setIsVideoPage(!!getYoutubeVideoId())
    }
    document.addEventListener("yt-navigate-finish", handleNavigateFinish)
    return () => {
      document.removeEventListener("yt-navigate-finish", handleNavigateFinish)
    }
  }, [])

  useEffect(() => {
    // ローカルストレージからデータを読み込みます。
    const loadData = async () => {
      try {
        const videoId = getYoutubeVideoId()
        const result = await chrome.storage.local.get([
          "teams",
          "buttonSets",
          "timelines",
          "selectedButtonSet"
        ])
        if (videoId && result.timelines) {
          setTimelineActions(result.timelines[videoId] || [])
        }
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

  const handleLabel = (label: string) => {
    // ラベルをアクションに追加します。
    for (const actionKey of activeActions) {
      const [team, action] = actionKey.split("_")
      addLabel(team, action, label)
    }
    setTimelineActions(getActions())
    setActiveLabels((prev) => {
      const updated = new Set(prev)
      updated.add(label)
      setTimeout(() => {
        setActiveLabels((current) => {
          const next = new Set(current)
          next.delete(label)
          return next
        })
      }, 1000)
      return updated
    })
  }

  const handleSaveTimeline = async () => {
    // タイムラインを保存します。
    const videoId = getYoutubeVideoId()
    if (videoId) {
      await saveTimelineForVideo(videoId)
    }
  }

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

  const filteredLabels = Object.fromEntries(
    buttonSets
      .find((set) => set.setName === selectedButtonSet)
      ?.buttons.filter((btn) => {
        // 同一アクションが複数チームで選択されている場合も考慮
        const actionCount = Array.from(selectedActions).filter((key) =>
          key.endsWith(`_${btn.action}`)
        ).length
        return actionCount > 0 // 1つ以上選択されている場合にラベルを表示
      })
      .flatMap((btn) => btn.labels.map((label) => [label, label])) || []
  )

  // デバッグ用：フィルタリングされたラベルの確認（開発時のみ）
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("[YouCoder Debug] フィルタリングされたラベル:", filteredLabels)
  }

  const handleActionToggle = (team: string, action: string) => {
    // アクションの開始・停止を切り替えます。
    const actionKey = `${team}_${action}`

    setActiveActions((prev) => {
      const updated = new Set(prev)
      if (updated.has(actionKey)) {
        stopAction(team, action)
        updated.delete(actionKey)
      } else {
        startAction(team, action)
        updated.add(actionKey)
      }
      console.log(
        `[YouCoder] アクティブなアクションを更新しました - 現在のアクション数: ${Array.from(updated).length}`
      )
      return updated
    })

    setSelectedActions((prev) => {
      const updated = new Set(prev)
      if (updated.has(actionKey)) {
        updated.delete(actionKey)
      } else {
        updated.add(actionKey)
      }
      console.log(
        `[YouCoder] 選択中のアクションを更新しました - 選択数: ${Array.from(updated).length}`
      )
      return updated
    })

    setTimelineActions(getActions())
  }

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
            onDelete={async () => {
              const result = await loadActionsFromStorage()
              setTimelineActions(getActions())
            }}
            onSave={handleSaveTimeline}
          />
        </>
      )}
    </div>
  )
}

export default MainContent
