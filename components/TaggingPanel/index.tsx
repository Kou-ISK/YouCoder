import React from "react"
import Draggable from "react-draggable"

import { ActionButton } from "../ActionButton"
import { LabelButton } from "../LabelButton"

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
    console.log("[TaggingPanel Debug] labels:", labels)
    console.log(
      "[TaggingPanel Debug] safeNormalizedLabels:",
      safeNormalizedLabels
    )
  }

  // カテゴリ付きラベルのリストを生成（各labelListが配列であることを保証）
  const categorizedLabels = Object.entries(safeNormalizedLabels).flatMap(
    ([category, labelList]) => {
      // labelListが配列でない場合は空配列として扱う
      const safeLabels = Array.isArray(labelList) ? labelList : []
      return safeLabels.map((label) => ({
        category,
        label,
        displayLabel: category === "一般" ? label : `${category} - ${label}`,
        clickValue: category === "一般" ? label : `${category} - ${label}`
      }))
    }
  )

  return (
    <Draggable handle=".drag-handle">
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "280px",
          maxWidth: "320px",
          border: "1px solid #e2e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
        <div
          className="drag-handle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #e5e7eb",
            cursor: "move",
            height: "8px"
          }}>
          <div
            style={{
              width: "20px",
              height: "4px",
              backgroundColor: "#d1d5db",
              borderRadius: "2px",
              margin: "0 auto"
            }}
          />
        </div>

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
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  padding: "4px 8px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0"
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
                <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                  {teams.map((team) => (
                    <div key={`${team}-${action}`} style={{ flex: 1 }}>
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
      </div>
    </Draggable>
  )
}
