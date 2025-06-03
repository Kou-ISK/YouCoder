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

      {/* チーム×アクションの表形式レイアウト */}
      <div style={{ marginBottom: "16px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "4px"
          }}>
          <thead>
            <tr>
              {teams.map((team) => (
                <th
                  key={team}
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "0 4px 6px 4px"
                  }}>
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(actions).map((action) => (
              <tr key={action}>
                {teams.map((team) => (
                  <td
                    key={`${team}-${action}`}
                    style={{ padding: "2px", textAlign: "center" }}>
                    <ActionButton
                      team={team}
                      action={action}
                      isActive={activeActions.has(`${team}_${action}`)}
                      onClick={onActionToggle}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
