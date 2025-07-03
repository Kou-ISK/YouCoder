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
  // アクションが選択されているかどうかを判定
  const hasActiveActions = activeActions.size > 0

  // ラベルが存在し、カテゴリにラベルが含まれているかを判定
  const hasLabels =
    labels &&
    typeof labels === "object" &&
    !Array.isArray(labels) &&
    Object.keys(labels).length > 0 &&
    Object.values(labels).some(
      (labelArray) => Array.isArray(labelArray) && labelArray.length > 0
    )

  // デバッグ用（開発時のみ）
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("[TaggingPanelContent Debug] 表示判定:", {
      hasActiveActions,
      hasLabels,
      shouldShowLabels: hasActiveActions && hasLabels,
      activeActionsCount: activeActions.size,
      labelsCategories: Object.keys(labels || {}),
      labels
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* アクションセクション */}
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={onActionToggle}
      />

      {/* ラベルセクション - アクションが選択されており、かつラベルが存在する場合のみ表示 */}
      {hasActiveActions && hasLabels && (
        <LabelsSection
          labels={labels}
          activeLabels={activeLabels}
          onLabelClick={onLabelClick}
        />
      )}
    </div>
  )
}
