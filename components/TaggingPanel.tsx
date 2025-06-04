import React from "react"
import Draggable from "react-draggable"

import { ActionButton } from "./ActionButton"
import { LabelButton } from "./LabelButton"

interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string[]>
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
}) => (
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
                      action={action}
                      isActive={activeActions.has(`${team}_${action}`)}
                      onClick={onActionToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ラベル部分 - 見出しなし */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px"
          }}>
          {Object.keys(labels).map((label) => (
            <LabelButton
              key={label}
              label={label}
              isActive={activeLabels.has(label)}
              isDisabled={false}
              onClick={() => onLabelClick(label)}
            />
          ))}
        </div>
      </div>
    </div>
  </Draggable>
)
