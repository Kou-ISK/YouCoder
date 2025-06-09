export interface TimelineTableProps {
  actions: any[]
  onDelete: (team: string, action: string, start: number) => void
  onSeek?: (time: number) => void
}
