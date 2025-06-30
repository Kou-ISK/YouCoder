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
      minWidth={380}
      minHeight={300}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-2xl shadow-2xl border-2 border-gray-200 hover:border-blue-300 font-sans z-[1000] backdrop-blur-md transition-all duration-300">
      <div className="p-4 w-full h-full overflow-hidden flex flex-col box-border">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
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
