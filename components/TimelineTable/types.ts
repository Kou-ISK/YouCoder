export interface TimelineTableProps {
  actions: any[]
  onDelete: (team: string, action: string, start: number) => void
  onSeek?: (time: number) => void
  onSort?: (key: "team" | "action" | "start" | "end") => void
  // ソート設定
  sortConfig?: {
    key: "team" | "action" | "start" | "end"
    direction: "asc" | "desc"
  }
  // 絞り込み設定
  filterConfig?: {
    team?: string
    action?: string
    label?: string
    timeRange?: {
      start: number
      end: number
    }
  }
}
