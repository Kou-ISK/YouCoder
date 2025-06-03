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
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb",
          cursor: "move"
        }}>
        <h3
          style={{
            margin: "0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937"
          }}>
          タグ付けパネル
        </h3>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981"
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        {teams.map((team) => (
          <div key={team} style={{ marginBottom: "12px" }}>
            <h4
              style={{
                margin: "0 0 6px 0",
                fontSize: "13px",
                fontWeight: "500",
                color: "#6b7280"
              }}>
              {team}
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
              {Object.keys(actions).map((action) => (
                <ActionButton
                  key={action}
                  team={team}
                  action={action}
                  isActive={activeActions.has(`${team}_${action}`)}
                  onClick={onActionToggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4
          style={{
            margin: "0 0 6px 0",
            fontSize: "13px",
            fontWeight: "500",
            color: "#6b7280"
          }}>
          ラベル
        </h4>
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
