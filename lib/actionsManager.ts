type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

const actions: Action[] = []
let teams: string[] = []

export const addTeam = (teamName: string) => {
  if (!teams.includes(teamName)) {
    teams.push(teamName)
    saveTeamsToStorage()
  }
}

export const removeTeam = (teamName: string) => {
  teams = teams.filter((team) => team !== teamName)
  saveTeamsToStorage()
}

export const getTeams = () => teams

// チーム名をストレージに保存
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

// チーム名をストレージから読み込み
const loadTeamsFromStorage = async () => {
  try {
    const result = await chrome.storage.local.get(["teams"])
    if (result.teams) {
      teams = result.teams
    }
    console.log("Loaded teams from storage:", teams)
  } catch (error) {
    console.error("Failed to load teams:", error)
  }
}

// YouTubeの再生時刻を取得する関数
const getYoutubeCurrentTime = (): number => {
  const video = document.querySelector("video")
  return video ? Math.floor(video.currentTime * 1000) : 0 // ミリ秒単位で返す
}

export const startAction = (team: string, action: string) => {
  const startTime = getYoutubeCurrentTime()
  actions.push({ team, action, start: startTime, labels: [] })
  saveActionsToStorage()
}

export const stopAction = (team: string, action: string) => {
  const endTime = getYoutubeCurrentTime()
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.end = endTime
    saveActionsToStorage()
  }
}

export const addLabel = (team: string, action: string, label: string) => {
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.labels.push(label)
    saveActionsToStorage()
  }
}

export const getActions = () => actions

// ローカルストレージキー
const STORAGE_KEY = "youcoder_actions"

// ローカルストレージにアクションを保存
export const saveActionsToStorage = async () => {
  try {
    // Get current actions and labels
    const data = await chrome.storage.local.get(["actions", "labels"])
    console.log("Saving current data:", data)
    await chrome.storage.local.set(data)
    console.log("Data saved successfully")
    return true
  } catch (error) {
    console.error("Failed to save actions:", error)
    return false
  }
}

// ローカルストレージからアクションを読み込み
export const loadActionsFromStorage = async () => {
  try {
    const result = await chrome.storage.local.get([
      "actions",
      "labels",
      "teams"
    ])
    console.log("Loaded data from storage:", result)
    if (result.teams) {
      teams = result.teams
    }
    return result
  } catch (error) {
    console.error("Failed to load data:", error)
    return { actions: {}, labels: {}, teams: [] }
  }
}

export const deleteAction = (team: string, action: string, start: number) => {
  const index = actions.findIndex(
    (a) => a.team === team && a.action === action && a.start === start
  )
  if (index !== -1) {
    actions.splice(index, 1)
    saveActionsToStorage() // 削除後に保存
  }
}

export const exportActionsToCSV = () => {
  const csvRows = [
    ["Team", "Action", "Start", "End", "Labels"], // ヘッダー行
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
  a.download = "actions.csv"
  a.click()
  URL.revokeObjectURL(url)
}
