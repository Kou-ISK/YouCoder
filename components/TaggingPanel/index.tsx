import React from "react"

import { DraggableResizable } from "~components/DraggableResizable"

import { usePanelPosition } from "./hooks/usePanelPosition"
import { TaggingPanelContent } from "./TaggingPanelContent"

interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]> | string[] // 新旧両方の形式をサポート + filteredLabelsの配列形式
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
  const { position, size, handlePositionChange, handleSizeChange } =
    usePanelPosition({
      storageKey: "taggingPanel"
    })

  return (
    <DraggableResizable
      initialPosition={position}
      initialSize={size}
      minWidth={250}
      minHeight={180}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      className="bg-white rounded-lg shadow-lg border border-gray-200 font-sans z-[1000]">
      <div className="p-2 w-full h-full overflow-hidden overflow-y-auto flex flex-col box-border">
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
    </DraggableResizable>
  )
}
