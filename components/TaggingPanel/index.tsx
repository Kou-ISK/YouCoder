import React from "react"

import { DraggableResizable } from "~components/DraggableResizable"

import { PANEL_SIZE, STYLES } from "../../constants"
import { useWorkspacePanel } from "../AnalysisWorkspace"
import { TaggingPanelContent } from "./TaggingPanelContent"

interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]> // カテゴリ形式のみをサポート
  activeActions: Set<string>
  activeLabels: Set<string>
  onActionToggle: (team: string, action: string) => void
  onLabelClick: (label: string) => void
}

/**
 * タグ付けパネルメインコンポーネント
 * ドラッグ可能でリサイズ可能なパネルとしてタグ付けUIを提供する
 */
export const TaggingPanel: React.FC<TaggingPanelProps> = ({
  teams,
  actions,
  labels,
  activeActions,
  activeLabels,
  onActionToggle,
  onLabelClick
}) => {
  // パネルの位置とサイズ管理
  const { position, size, bounds, handlePositionChange, handleSizeChange } =
    useWorkspacePanel("taggingPanel")

  return (
    <DraggableResizable
      initialPosition={position}
      initialSize={size}
      bounds={bounds}
      title="タグ付け"
      minWidth={PANEL_SIZE.TAGGING_PANEL.MIN_WIDTH}
      minHeight={PANEL_SIZE.TAGGING_PANEL.MIN_HEIGHT}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-3xl shadow-2xl border-2 border-gray-200 hover:border-blue-400 font-sans backdrop-blur-xl transition-shadow duration-300 hover:shadow-3xl"
      style={{ zIndex: STYLES.Z_INDEX.TAGGING_PANEL }}>
      <div className="p-3 w-full h-full overflow-hidden flex flex-col box-border">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <TaggingPanelContent
            teams={teams}
            actions={actions}
            labels={labels}
            activeActions={activeActions}
            activeLabels={activeLabels}
            onActionToggle={onActionToggle}
            onLabelClick={onLabelClick}
          />
        </div>
      </div>
    </DraggableResizable>
  )
}
