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
    console.log("Teams saved successfully")
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
    console.log("Loaded data from storage:", result)
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
    console.log("Loaded teams from storage:", teams)
  } catch (error) {
    console.error("Failed to load teams:", error)
  }
}

const getYoutubeCurrentTime = (): number => {
  const video = document.querySelector("video")
  return video ? Math.floor(video.currentTime * 1000) : 0 // YouTube動画の現在の再生時間を取得します。
}

const getYoutubeVideoId = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("v") // YouTube動画のIDを取得します。
}

// アクションを開始する関数。
export const startAction = (team: string, action: string) => {
  const startTime = getYoutubeCurrentTime()
  actions.push({ team, action, start: startTime, labels: [] }) // 新しいアクションを開始します。
  saveTimelineForVideo(getYoutubeVideoId())
}

// アクションを停止する関数。
export const stopAction = (team: string, action: string) => {
  const endTime = getYoutubeCurrentTime()
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.end = endTime // アクションを停止します。
    saveTimelineForVideo(getYoutubeVideoId())
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
    console.log("Timeline saved for video:", videoId)
  } catch (error) {
    console.error("Failed to save timeline for video:", error)
  }
}

// 動画のタイムラインをローカルストレージから読み込む非同期関数。
export const loadTimelineForVideo = async (videoId: string | null) => {
  if (!videoId) return []
  try {
    const timelines = await chrome.storage.local.get(["timelines"])
    return timelines[videoId] || [] // 動画のタイムラインを読み込みます。
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
