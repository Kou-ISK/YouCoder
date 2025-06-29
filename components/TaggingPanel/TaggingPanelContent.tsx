import React from "react"

import { ActionsSection } from "./ActionsSection"
import { LabelsSection } from "./LabelsSection"
import type { TaggingPanelContentProps } from "./types"

/**
 * タグ付けパネルのメインコンテンツコンポーネント
 * アクションとラベルの選択UIを提供する
 */
export const TaggingPanelContent: React.FC<TaggingPanelContentProps> = ({
  teams,
  actions,
  labels,
  activeActions,
  activeLabels,
  onActionToggle,
  onLabelClick
}) => {
  // デバッグ用（開発時のみ）
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("[TaggingPanelContent Debug] labels:", labels)
  }

  return (
    <div className="flex flex-col h-full">
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={onActionToggle}
      />

      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={onLabelClick}
      />
    </div>
  )
}
