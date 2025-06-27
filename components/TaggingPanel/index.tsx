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
      minWidth={280}
      minHeight={200}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e2e8f0",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        zIndex: 1000
      }}>
      <div
        style={{
          padding: "8px",
          width: "100%",
          height: "100%",
          overflow: "hidden auto",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}>
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
