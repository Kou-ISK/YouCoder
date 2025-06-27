import React from "react"

import { ActionButton } from "~components/ActionButton"
import { LabelButton } from "~components/LabelButton"

import type { TaggingPanelContentProps } from "./types"

export const TaggingPanelContent: React.FC<TaggingPanelContentProps> = ({
  teams,
  actions,
  labels,
  activeActions,
  activeLabels,
  onActionToggle,
  onLabelClick
}) => {
  // ラベルを安全にカテゴリ付きに正規化
  const safeNormalizedLabels = Array.isArray(labels)
    ? { 一般: labels }
    : typeof labels === "object" && labels !== null
      ? labels
      : { 一般: [] }

  // デバッグ用（開発時のみ）
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("[TaggingPanelContent Debug] labels:", labels)
    console.log(
      "[TaggingPanelContent Debug] safeNormalizedLabels:",
      safeNormalizedLabels
    )
  }

  return (
    <>
      {/* チーム×アクションの水平レイアウト */}
      <div style={{ marginBottom: "16px" }}>
        {/* チーム名を水平に表示 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "8px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "8px"
          }}>
          {teams.map((team) => (
            <div
              key={team}
              style={{
                flex: 1,
                minWidth: 0, // flexアイテムが縮小可能にする
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                padding: "4px 8px",
                backgroundColor: "#f8fafc",
                borderRadius: "4px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
              {team}
            </div>
          ))}
        </div>

        {/* 各アクションを行として表示 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.keys(actions).map((action) => (
            <div
              key={action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 0"
              }}>
              {/* 各チームのボタン */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flex: 1,
                  minWidth: 0
                }}>
                {teams.map((team) => (
                  <div
                    key={`${team}-${action}`}
                    style={{
                      flex: 1,
                      minWidth: 0
                    }}>
                    <ActionButton
                      team={team}
                      action={actions[action]}
                      isActive={activeActions.has(`${team}_${action}`)}
                      onClick={() => onActionToggle(team, action)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ラベル部分 - カテゴリ別に表示 */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
        {Object.entries(safeNormalizedLabels).map(([category, labelList]) => {
          // labelList が配列であることを確認
          const safeLabelList = Array.isArray(labelList) ? labelList : []

          return (
            <div key={category} style={{ marginBottom: "8px" }}>
              {/* カテゴリが "一般" 以外の場合のみカテゴリ名を表示 */}
              {category !== "一般" && (
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6b7280",
                    marginBottom: "4px",
                    paddingLeft: "4px"
                  }}>
                  {category}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginLeft: category !== "一般" ? "8px" : "0px"
                }}>
                {safeLabelList.map((label) => {
                  const displayLabel =
                    category === "一般" ? label : `${category} - ${label}`
                  return (
                    <LabelButton
                      key={displayLabel}
                      label={label}
                      isActive={activeLabels.has(displayLabel)}
                      isDisabled={false}
                      onClick={() => onLabelClick(displayLabel)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
