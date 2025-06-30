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
      {/* ヘッダータイトル */}
      <div className="mb-4 text-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-200">
        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center">
          <span className="mr-2 text-2xl">⚽</span>
          タグ付けパネル
        </h2>
        <div className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-4">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
            チーム: {teams.length}
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            アクション: {Object.keys(actions).length}
          </span>
        </div>
      </div>

      {/* アクションセクション */}
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={onActionToggle}
      />

      {/* ラベルセクション */}
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={onLabelClick}
      />
    </div>
  )
}
