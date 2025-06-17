import { TaggingPanel } from "components/TaggingPanel"
import { TimelinePanel } from "components/TimelinePanel"
import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"

import {
  addLabel,
  deleteAction,
  getActions,
  getYoutubeVideoId,
  loadActionsFromStorage,
  loadTimelineForVideo,
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
      const currentVideoPage = !!getYoutubeVideoId()
      if (currentVideoPage !== isVideoPage) {
        setIsVideoPage(currentVideoPage)

        // 動画が変わった際にタイムラインと UI 状態を同期
        const syncTimelineAndUI = async () => {
          const videoId = getYoutubeVideoId()
          if (videoId) {
            try {
              const result = await chrome.storage.local.get(["timelines"])
              const videoTimeline = result.timelines?.[videoId] || []
              setTimelineActions(videoTimeline)

              // 進行中のアクションをUI状態に同期
              const inProgressActions = new Set<string>()
              videoTimeline.forEach((action: any) => {
                if (!action.end) {
                  const actionKey = `${action.team}_${action.action}`
                  inProgressActions.add(actionKey)
                }
              })

              setActiveActions(inProgressActions)
              setSelectedActions(new Set(inProgressActions))

              console.log(
                `[YouCoder] 動画変更時にUI状態を同期しました - 動画ID: ${videoId}, 進行中アクション数: ${inProgressActions.size}`
              )
            } catch (error) {
              console.error("[YouCoder] 動画変更時の同期エラー:", error)
            }
          } else {
            // 動画ページでない場合は状態をクリア
            setActiveActions(new Set())
            setSelectedActions(new Set())
            setTimelineActions([])
          }
        }

        syncTimelineAndUI()
      }
    }, 500)
    return () => clearInterval(timer)
  }, [isVideoPage])

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
    // YouTubeのナビゲーションイベントを監視します。
    const handleNavigateFinish = async () => {
      const currentVideoPage = !!getYoutubeVideoId()
      setIsVideoPage(currentVideoPage)

      // ナビゲーション後にタイムラインとUI状態を同期
      if (currentVideoPage) {
        const videoId = getYoutubeVideoId()
        if (videoId) {
          try {
            const result = await chrome.storage.local.get(["timelines"])
            const videoTimeline = result.timelines?.[videoId] || []
            setTimelineActions(videoTimeline)

            // 進行中のアクションをUI状態に同期
            const inProgressActions = new Set<string>()
            videoTimeline.forEach((action: any) => {
              if (!action.end) {
                const actionKey = `${action.team}_${action.action}`
                inProgressActions.add(actionKey)
              }
            })

            setActiveActions(inProgressActions)
            setSelectedActions(new Set(inProgressActions))

            console.log(
              `[YouCoder] ナビゲーション後にUI状態を同期しました - 動画ID: ${videoId}, 進行中アクション数: ${inProgressActions.size}`
            )
          } catch (error) {
            console.error("[YouCoder] ナビゲーション後の同期エラー:", error)
          }
        }
      } else {
        // 動画ページでない場合は状態をクリア
        setActiveActions(new Set())
        setSelectedActions(new Set())
        setTimelineActions([])
      }
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

        // 動画のタイムラインデータを読み込み、進行中のアクションの状態を同期
        if (videoId && result.timelines) {
          const videoTimeline = result.timelines[videoId] || []
          setTimelineActions(videoTimeline)

          // 進行中のアクション（end プロパティがない）をUI状態に同期
          const inProgressActions = new Set<string>()
          videoTimeline.forEach((action: any) => {
            if (!action.end) {
              // 終了時間がない = 進行中
              const actionKey = `${action.team}_${action.action}`
              inProgressActions.add(actionKey)
            }
          })

          // UI状態を進行中のアクションと同期
          setActiveActions(inProgressActions)
          setSelectedActions(new Set(inProgressActions))

          console.log(
            `[YouCoder] UI状態をタイムラインデータと同期しました - 進行中アクション数: ${inProgressActions.size}`
          )
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

  const handleLabel = async (label: string) => {
    // ラベルをアクションに追加します。
    for (const actionKey of activeActions) {
      const [team, action] = actionKey.split("_")
      addLabel(team, action, label)
    }

    // 自動保存を実行
    const videoId = getYoutubeVideoId()
    if (videoId) {
      await saveTimelineForVideo(videoId)
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

  // ラベルの正規化関数：新旧両方の形式に対応
  const normalizeLabelsToFlat = (
    labels: Record<string, string[]> | string[]
  ): string[] => {
    if (Array.isArray(labels)) {
      return labels
    }
    // カテゴリ付きラベルの場合、カテゴリ情報を含めて平坦化
    return Object.entries(labels).flatMap(([category, labelList]) =>
      labelList.map((label) =>
        category === "一般" ? label : `${category} - ${label}`
      )
    )
  }

  const filteredLabels =
    buttonSets
      .find((set) => set.setName === selectedButtonSet)
      ?.buttons.filter((btn) => {
        // 同一アクションが複数チームで選択されている場合も考慮
        const actionCount = Array.from(activeActions).filter((key) =>
          key.endsWith(`_${btn.action}`)
        ).length
        return actionCount > 0 // 1つ以上選択されている場合にラベルを表示
      })
      .flatMap((btn) => {
        const flatLabels = normalizeLabelsToFlat(btn.labels)
        return flatLabels
      }) || []

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

    // アクション変更後にタイムラインの状態を更新
    setTimeout(() => {
      setTimelineActions(getActions())
    }, 100) // 少し遅延させてアクションの更新を確実に反映
  }

  // 動画ページでのタイムライン同期を定期的に実行
  useEffect(() => {
    if (!isVideoPage) return

    const timer = setInterval(() => {
      const currentActions = getActions()
      setTimelineActions([...currentActions])
    }, 1000) // 1秒ごとに同期

    return () => clearInterval(timer)
  }, [isVideoPage])

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
            onDelete={(team, action, start) => {
              console.log(
                `[YouCoder] 削除開始: ${team} - ${action} - ${start}ms`
              )

              // 1. UI状態を即座に更新（削除対象をフィルタリング）
              const newActions = timelineActions.filter(
                (a) =>
                  !(a.team === team && a.action === action && a.start === start)
              )
              setTimelineActions(newActions)
              console.log(
                `[YouCoder] UI更新完了 - 削除後のアクション数: ${newActions.length}`
              )

              // 2. バックグラウンドでストレージとメモリを更新
              deleteAction(team, action, start).catch((error) => {
                console.error("[YouCoder] バックグラウンド削除エラー:", error)
                // エラーの場合はUIを元に戻す
                setTimelineActions([...timelineActions])
                console.warn(
                  "[YouCoder] 削除に失敗したため、UIを元に戻しました"
                )
              })
            }}
            onSave={handleSaveTimeline}
          />
        </>
      )}
    </div>
  )
}

export default MainContent
