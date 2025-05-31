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
    await chrome.storage.local.set({ teams })
    console.log(
      `[YouCoder] チーム情報を保存しました - チーム数: ${teams.length}`
    )
    return true
  } catch (error) {
    console.error("Failed to save teams:", error)
    return false
  }
}

// ローカルストレージからアクションを読み込む非同期関数。
export const loadActionsFromStorage = async () => {
  try {
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
    console.error("Failed to load data:", error)
    return { actions: {}, labels: {}, teams: [] }
  }
}

const loadTeamsFromStorage = async () => {
  try {
    const result = await chrome.storage.local.get(["teams"])
    if (result.teams) {
      teams = result.teams // ローカルストレージからチーム名を読み込みます。
    }
    console.log(
      `[YouCoder] チーム情報を読み込みました - チーム数: ${teams.length}`
    )
  } catch (error) {
    console.error("Failed to load teams:", error)
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
export const startAction = (team: string, action: string) => {
  try {
    const startTime = getYoutubeCurrentTime()
    if (startTime === 0) {
      console.warn(
        `[YouCoder] 動画時間が0です。動画が正常に再生されているか確認してください。`
      )
    }
    actions.push({ team, action, start: startTime, labels: [] }) // 新しいアクションを開始します。
    console.log(
      `[YouCoder] アクション開始: ${team} - ${action} (時間: ${startTime}ms)`
    )
    saveTimelineForVideo(getYoutubeVideoId())
  } catch (error) {
    console.error(
      `[YouCoder] アクション開始エラー (${team} - ${action}):`,
      error
    )
  }
}

// アクションを停止する関数。
export const stopAction = (team: string, action: string) => {
  try {
    const endTime = getYoutubeCurrentTime()
    const actionItem = actions.find(
      (a) => a.team === team && a.action === action && !a.end
    )
    if (actionItem) {
      actionItem.end = endTime // アクションを停止します。
      const duration = endTime - actionItem.start
      console.log(
        `[YouCoder] アクション終了: ${team} - ${action} (継続時間: ${duration}ms)`
      )
      saveTimelineForVideo(getYoutubeVideoId())
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
export const addLabel = (team: string, action: string, label: string) => {
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.labels.push(label) // アクションにラベルを追加します。
    saveTimelineForVideo(getYoutubeVideoId())
  }
}

// 現在のアクションのリストを取得する関数。
export const getActions = () => actions // 現在のアクションのリストを取得します。

// 動画のタイムラインをローカルストレージに保存する非同期関数。
export const saveTimelineForVideo = async (videoId: string | null) => {
  if (!videoId) return
  try {
    const timelines = await chrome.storage.local.get(["timelines"])
    timelines[videoId] = actions // 動画のタイムラインを保存します。
    await chrome.storage.local.set({ timelines })
    console.log(
      `[YouCoder] タイムラインを保存しました - 動画ID: ${videoId}, アクション数: ${actions.length}`
    )
  } catch (error) {
    console.error("Failed to save timeline for video:", error)
  }
}

// 動画のタイムラインをローカルストレージから読み込む非同期関数。
export const loadTimelineForVideo = async (videoId: string | null) => {
  if (!videoId) return []
  try {
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
    console.error("Failed to load timeline for video:", error)
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
export const exportActionsToCSV = () => {
  const csvRows = [
    ["Team", "Action", "Start", "End", "Labels"],
    ...actions.map((a) => [
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
