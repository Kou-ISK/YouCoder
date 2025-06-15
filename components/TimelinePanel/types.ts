export type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

export type SortConfig = {
  key: "team" | "action" | "start" | "end"
  direction: "asc" | "desc"
}

export type FilterConfig = {
  team?: string
  action?: string
  label?: string
  timeRange?: {
    start: number
    end: number
  }
}

export interface TimelinePanelProps {
  actions: Action[]
  onDelete?: (team: string, action: string, start: number) => void
  onSave?: () => void
  onExportCSV?: () => void
  onSeek?: (time: number) => void
  defaultSort?: SortConfig
  defaultFilter?: FilterConfig
}
