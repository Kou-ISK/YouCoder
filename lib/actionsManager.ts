// Window型の拡張
declare global {
  interface Window {
    youCoderCache?: { [key: string]: any[] }
  }
}

// Action型は、チーム、アクション名、開始時刻、終了時刻、関連付けられたラベルを含むデータ構造です。
type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

const actions: Action[] = [] // 現在のアクションのリストを保持します。

let teams: string[] = [] // 利用可能なチーム名のリストを保持します。

// チームを追加する関数。既存のチーム名と重複しない場合に追加します。
export const addTeam = (teamName: string) => {
  if (!teams.includes(teamName)) {
    teams.push(teamName)
    saveTeamsToStorage() // チーム名をローカルストレージに保存します。
  }
}

// チームを削除する関数。
export const removeTeam = (teamName: string) => {
  teams = teams.filter((team) => team !== teamName)
  saveTeamsToStorage() // チーム名をローカルストレージから削除します。
}

// 現在のチーム名のリストを取得する関数。
export const getTeams = () => teams // 現在のチーム名のリストを取得します。

// チーム名をローカルストレージに保存する非同期関数。
const saveTeamsToStorage = async () => {
  try {
    // Chrome拡張機能のストレージAPIが利用可能かチェック
    if (!chrome?.storage?.local) {
      throw new Error("Chrome storage API not available")
    }

    await chrome.storage.local.set({ teams })
    console.log(
      `[YouCoder] チーム情報を保存しました - チーム数: ${teams.length}`
    )
    return true
  } catch (error) {
    console.error("[YouCoder] チーム保存エラー:", error)

    // 代替手段として、sessionStorageに保存を試行
    try {
      sessionStorage.setItem("youCoder_teams", JSON.stringify(teams))
      console.log(
        "[YouCoder] 代替保存（sessionStorage）でチーム情報を保存しました"
      )
      return true
    } catch (fallbackError) {
      console.error("[YouCoder] 代替保存も失敗:", fallbackError)
      return false
    }
  }
}

// ローカルストレージからアクションを読み込む非同期関数。
export const loadActionsFromStorage = async () => {
  try {
    // Chrome拡張機能のストレージAPIが利用可能かチェック
    if (!chrome?.storage?.local) {
      throw new Error("Chrome storage API not available")
    }

    const result = await chrome.storage.local.get([
      "actions",
      "labels",
      "teams"
    ])
    console.log(
      `[YouCoder] ストレージからデータを読み込みました - チーム数: ${result.teams?.length || 0}`
    )
    if (result.teams) {
      teams = result.teams // ローカルストレージからチーム名を読み込みます。
    }
    return result
  } catch (error) {
    console.error("[YouCoder] データ読み込みエラー:", error)

    // 代替手段として、sessionStorageから読み込みを試行
    try {
      const teamsData = sessionStorage.getItem("youCoder_teams")
      if (teamsData) {
        teams = JSON.parse(teamsData)
        console.log(
          "[YouCoder] 代替読み込み（sessionStorage）でチーム情報を読み込みました"
        )
      }
      return { actions: {}, labels: {}, teams: teams }
    } catch (fallbackError) {
      console.error("[YouCoder] 代替読み込みも失敗:", fallbackError)
      return { actions: {}, labels: {}, teams: [] }
    }
  }
}

const loadTeamsFromStorage = async () => {
  try {
    // Chrome拡張機能のストレージAPIが利用可能かチェック
    if (!chrome?.storage?.local) {
      throw new Error("Chrome storage API not available")
    }

    const result = await chrome.storage.local.get(["teams"])
    if (result.teams) {
      teams = result.teams // ローカルストレージからチーム名を読み込みます。
    }
    console.log(
      `[YouCoder] チーム情報を読み込みました - チーム数: ${teams.length}`
    )
  } catch (error) {
    console.error("[YouCoder] チーム読み込みエラー:", error)

    // 代替手段として、sessionStorageから読み込みを試行
    try {
      const teamsData = sessionStorage.getItem("youCoder_teams")
      if (teamsData) {
        teams = JSON.parse(teamsData)
        console.log(
          "[YouCoder] 代替読み込み（sessionStorage）でチーム情報を読み込みました"
        )
      }
    } catch (fallbackError) {
      console.error("[YouCoder] 代替読み込みも失敗:", fallbackError)
    }
  }
}

const getYoutubeCurrentTime = (): number => {
  try {
    const video = document.querySelector("video") as HTMLVideoElement
    if (!video) {
      console.warn("[YouCoder] 動画要素が見つかりません")
      return 0
    }

    // 動画の状態をチェック
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      console.error("[YouCoder] 動画ソースが利用できません (403エラーの可能性)")
      return 0
    }

    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      console.warn("[YouCoder] 動画メタデータがまだ読み込まれていません")
      return 0
    }

    // エラー状態をチェック
    if (video.error) {
      let errorMsg = "不明な動画エラー"
      switch (video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMsg = "動画の読み込みが中断されました"
          break
        case MediaError.MEDIA_ERR_NETWORK:
          errorMsg = "ネットワークエラー (403 Forbiddenの可能性)"
          break
        case MediaError.MEDIA_ERR_DECODE:
          errorMsg = "動画デコードエラー"
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMsg = "サポートされていない動画形式"
          break
      }
      console.error(`[YouCoder] 動画エラー検出: ${errorMsg}`)
      return 0
    }

    const currentTime = Math.floor(video.currentTime * 1000)
    if (currentTime === 0 && video.currentTime > 0) {
      console.warn("[YouCoder] 動画時間の変換で問題が発生しました")
    }

    return currentTime
  } catch (error) {
    console.error("[YouCoder] 動画時間の取得に失敗:", error)
    return 0
  }
}

const getYoutubeVideoId = (): string | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const videoId = urlParams.get("v")
    if (!videoId) {
      console.warn(
        "[YouCoder] 動画IDが取得できません - YouTube動画ページではない可能性があります"
      )
    }
    return videoId // YouTube動画のIDを取得します。
  } catch (error) {
    console.error("[YouCoder] 動画ID取得エラー:", error)
    return null
  }
}

// アクションを開始する関数。
export const startAction = async (team: string, action: string) => {
  try {
    const videoId = getYoutubeVideoId()

    // 初回のみ、または配列が空の場合のみタイムラインを読み込む
    if (videoId && actions.length === 0) {
      await loadTimelineForVideo(videoId)
      console.log(
        `[YouCoder] 初回タイムライン読み込み完了 - 動画ID: ${videoId}, 既存アクション数: ${actions.length}`
      )
    }

    const startTime = getYoutubeCurrentTime()
    if (startTime === 0) {
      console.warn(
        `[YouCoder] 動画時間が0です。動画が正常に再生されているか確認してください。`
      )
    }
    actions.push({ team, action, start: startTime, labels: [] }) // 新しいアクションを開始します。
    console.log(
      `[YouCoder] アクション開始: ${team} - ${action} (時間: ${startTime}ms) - 総アクション数: ${actions.length}`
    )
    // 非同期でタイムラインを保存（エラーが発生してもアクション自体は継続）
    saveTimelineForVideo(videoId).catch((error) => {
      console.error(
        `[YouCoder] アクション開始時の保存エラー (${team} - ${action}):`,
        error
      )
    })
  } catch (error) {
    console.error(
      `[YouCoder] アクション開始エラー (${team} - ${action}):`,
      error
    )
  }
}

// アクションを停止する関数。
export const stopAction = async (team: string, action: string) => {
  try {
    const videoId = getYoutubeVideoId()

    // stopAction時はメモリ上のデータを優先し、読み込みを行わない
    // （既に進行中のアクションの状態を保持するため）

    const endTime = getYoutubeCurrentTime()
    const actionItem = actions.find(
      (a) => a.team === team && a.action === action && !a.end
    )
    if (actionItem) {
      actionItem.end = endTime // アクションを停止します。
      const duration = endTime - actionItem.start
      console.log(
        `[YouCoder] アクション終了: ${team} - ${action} (継続時間: ${duration}ms) - 総アクション数: ${actions.length}`
      )
      // 非同期でタイムラインを保存
      saveTimelineForVideo(videoId).catch((error) => {
        console.error(
          `[YouCoder] アクション停止時の保存エラー (${team} - ${action}):`,
          error
        )
      })
    } else {
      console.warn(
        `[YouCoder] 停止対象のアクションが見つかりません: ${team} - ${action}`
      )
    }
  } catch (error) {
    console.error(
      `[YouCoder] アクション停止エラー (${team} - ${action}):`,
      error
    )
  }
}

// アクションにラベルを追加する関数。
export const addLabel = async (team: string, action: string, label: string) => {
  try {
    const videoId = getYoutubeVideoId()

    // actionsが空の場合のみタイムラインデータを読み込む（初期ロード時のみ）
    if (actions.length === 0 && videoId) {
      console.log(
        "[YouCoder] 初期ロード: addLabel時にタイムラインデータを読み込みます"
      )
      await loadTimelineForVideo(videoId)
    }

    const actionItem = actions.find(
      (a) => a.team === team && a.action === action && !a.end
    )
    if (actionItem) {
      actionItem.labels.push(label) // アクションにラベルを追加します。
      console.log(
        `[YouCoder] ラベル追加: ${team} - ${action} にラベル "${label}" を追加 - 総アクション数: ${actions.length}`
      )

      // 非同期で自動保存（エラーが発生してもラベル追加自体は継続）
      if (videoId) {
        saveTimelineForVideo(videoId).catch((error) => {
          console.error(
            `[YouCoder] ラベル追加時の保存エラー (${team} - ${action} - ${label}):`,
            error
          )
        })
      }
    } else {
      console.warn(
        `[YouCoder] ラベル追加対象のアクションが見つかりません: ${team} - ${action}`
      )
    }
  } catch (error) {
    console.error(
      `[YouCoder] ラベル追加エラー (${team} - ${action} - ${label}):`,
      error
    )
  }
}

// 現在のアクションのリストを取得する関数。
export const getActions = () => actions // 現在のアクションのリストを取得します。

// 動画のタイムラインをローカルストレージに保存する非同期関数。
export const saveTimelineForVideo = async (
  videoId: string | null,
  retryCount = 3
) => {
  if (!videoId) {
    console.warn(
      "[YouCoder] 動画IDが提供されていないため、保存をスキップします"
    )
    return false
  }

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // Chrome拡張機能のストレージAPIが利用可能かチェック
      if (!chrome?.storage?.local) {
        throw new Error("Chrome storage API is not available")
      }

      // ストレージアクセス権限をチェック
      if (typeof chrome.storage.local.get !== "function") {
        throw new Error("Storage API methods are not accessible")
      }

      const result = await chrome.storage.local.get(["timelines"])
      const timelines = result.timelines || {}
      timelines[videoId] = [...actions] // 配列のコピーを作成して保存

      await chrome.storage.local.set({ timelines })
      console.log(
        `[YouCoder] タイムラインを保存しました - 動画ID: ${videoId}, アクション数: ${actions.length} (試行回数: ${attempt})`
      )
      return true // 成功
    } catch (error) {
      console.error(
        `[YouCoder] タイムライン保存エラー (試行 ${attempt}/${retryCount}):`,
        error
      )

      // 権限エラーの場合は代替保存を試行
      if (
        error.message?.includes("Permission denied") ||
        error.message?.includes("requestStorageAccessFor") ||
        attempt === retryCount
      ) {
        try {
          // 代替手段として、sessionStorageに保存
          const sessionKey = `youCoder_timeline_${videoId}`
          sessionStorage.setItem(sessionKey, JSON.stringify(actions))
          console.log(
            `[YouCoder] 代替保存（sessionStorage）でタイムラインを保存しました - 動画ID: ${videoId}`
          )
          return true
        } catch (fallbackError) {
          console.error("[YouCoder] 代替保存も失敗:", fallbackError)

          // 最後の手段として、メモリ内の一時保存システムを使用
          if (!window.youCoderCache) {
            window.youCoderCache = {}
          }
          window.youCoderCache[videoId] = [...actions]
          console.log(
            `[YouCoder] メモリ内キャッシュにタイムラインを保存しました - 動画ID: ${videoId}`
          )
          return true
        }
      }

      if (attempt < retryCount) {
        // リトライ前に少し待機
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt))
      }
    }
  }

  console.error("[YouCoder] すべての保存試行が失敗しました")
  return false
}

// 動画のタイムラインをローカルストレージから読み込む非同期関数。
export const loadTimelineForVideo = async (videoId: string | null) => {
  if (!videoId) {
    console.warn(
      "[YouCoder] 動画IDが提供されていないため、読み込みをスキップします"
    )
    return []
  }

  try {
    // Chrome拡張機能のストレージAPIが利用可能かチェック
    if (!chrome?.storage?.local) {
      throw new Error("Chrome storage API is not available")
    }

    const result = await chrome.storage.local.get(["timelines"])
    const videoTimeline = result.timelines?.[videoId] || []

    // actionsManagerの内部状態も更新する
    actions.length = 0 // 配列をクリア
    actions.push(...videoTimeline) // 読み込んだデータで配列を更新

    console.log(
      `[YouCoder] タイムラインを読み込みました - 動画ID: ${videoId}, アクション数: ${videoTimeline.length}`
    )
    return videoTimeline // 動画のタイムラインを読み込みます。
  } catch (error) {
    console.error("[YouCoder] タイムライン読み込みエラー:", error)

    // 代替手段として、sessionStorageから読み込みを試行
    try {
      const sessionKey = `youCoder_timeline_${videoId}`
      const sessionData = sessionStorage.getItem(sessionKey)
      if (sessionData) {
        const videoTimeline = JSON.parse(sessionData)
        actions.length = 0
        actions.push(...videoTimeline)
        console.log(
          `[YouCoder] 代替読み込み（sessionStorage）でタイムラインを読み込みました - 動画ID: ${videoId}`
        )
        return videoTimeline
      }
    } catch (fallbackError) {
      console.error("[YouCoder] sessionStorage読み込みエラー:", fallbackError)
    }

    // 最後の手段として、メモリ内キャッシュから読み込み
    try {
      if (window.youCoderCache && window.youCoderCache[videoId]) {
        const videoTimeline = window.youCoderCache[videoId]
        actions.length = 0
        actions.push(...videoTimeline)
        console.log(
          `[YouCoder] メモリ内キャッシュからタイムラインを読み込みました - 動画ID: ${videoId}`
        )
        return videoTimeline
      }
    } catch (cacheError) {
      console.error("[YouCoder] メモリキャッシュ読み込みエラー:", cacheError)
    }

    console.warn(
      `[YouCoder] すべての読み込み試行が失敗しました - 動画ID: ${videoId}`
    )
    return []
  }
}

// アクションを削除する関数。
export const deleteAction = (team: string, action: string, start: number) => {
  const index = actions.findIndex(
    (a) => a.team === team && a.action === action && a.start === start
  )
  if (index !== -1) {
    actions.splice(index, 1) // 指定されたアクションを削除します。
    saveTimelineForVideo(getYoutubeVideoId())
  }
}

// アクションをCSV形式でエクスポートする関数。
export const exportActionsToCSV = (actionsList: Action[] = actions) => {
  const csvRows = [
    ["Team", "Action", "Start", "End", "Labels"],
    ...actionsList.map((a) => [
      a.team,
      a.action,
      new Date(a.start).toISOString(),
      a.end ? new Date(a.end).toISOString() : "",
      a.labels.join(", ")
    ])
  ]

  const csvContent = csvRows.map((row) => row.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = "actions.csv" // アクションをCSV形式でエクスポートします。
  a.click()
  URL.revokeObjectURL(url)
}
