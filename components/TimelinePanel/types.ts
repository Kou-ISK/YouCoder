export type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

export interface TimelinePanelProps {
  actions: Action[]
  onDelete?: (team: string, action: string, start: number) => void
  onSave?: () => void
  onExportCSV?: () => void
  onSeek?: (time: number) => void
}
