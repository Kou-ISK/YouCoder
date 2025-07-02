export interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]> // カテゴリ形式のみをサポート
  activeActions: Set<string>
  activeLabels: Set<string>
  onActionToggle: (team: string, action: string) => void
  onLabelClick: (label: string) => void
}

export interface TaggingPanelContentProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]>
  activeActions: Set<string>
  activeLabels: Set<string>
  onActionToggle: (team: string, action: string) => void
  onLabelClick: (label: string) => void
}
