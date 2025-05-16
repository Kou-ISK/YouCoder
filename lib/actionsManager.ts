type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

const actions: Action[] = []

export const startAction = (team: string, action: string) => {
  const startTime = Date.now()
  actions.push({ team, action, start: startTime, labels: [] })
}

export const stopAction = (team: string, action: string) => {
  const endTime = Date.now()
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.end = endTime
  }
}

export const addLabel = (team: string, action: string, label: string) => {
  const actionItem = actions.find(
    (a) => a.team === team && a.action === action && !a.end
  )
  if (actionItem) {
    actionItem.labels.push(label)
  }
}

export const getActions = () => actions

// ローカルストレージキー
const STORAGE_KEY = "youcoder_actions"

// ローカルストレージにアクションを保存
export const saveActionsToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions))
}

// ローカルストレージからアクションを読み込み
export const loadActionsFromStorage = () => {
  const storedActions = localStorage.getItem(STORAGE_KEY)
  if (storedActions) {
    const parsedActions: Action[] = JSON.parse(storedActions)
    actions.push(...parsedActions)
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
