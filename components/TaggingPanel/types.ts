export interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]> | string[] // 新旧両方の形式をサポート + filteredLabelsの配列形式
  activeActions: Set<string>
  activeLabels: Set<string>
  onActionToggle: (team: string, action: string) => void
  onLabelClick: (label: string) => void
}

export interface TaggingPanelContentProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]> | string[]
  activeActions: Set<string>
  activeLabels: Set<string>
  onActionToggle: (team: string, action: string) => void
  onLabelClick: (label: string) => void
}
