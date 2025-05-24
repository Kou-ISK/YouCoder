import React from "react"
import Draggable from "react-draggable"

import { ActionButton } from "./ActionButton"
import { LabelButton } from "./LabelButton"

interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  labels: Record<string, string>
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
  <Draggable>
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 1000,
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        cursor: "move",
        minWidth: "300px"
      }}>
      <h3>タグ付けパネル</h3>
      <div style={{ marginBottom: "20px" }}>
        {teams.map((team) => (
          <div key={team} style={{ marginBottom: "10px" }}>
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
        ))}
      </div>

      <div>
        <h4>ラベル</h4>
        <div style={{ marginBottom: "10px" }}>
          {Object.keys(labels).map((label) => (
            <LabelButton
              key={label}
              label={label}
              isActive={activeLabels.has(label)}
              isDisabled={activeActions.size === 0}
              onClick={onLabelClick}
            />
          ))}
        </div>
      </div>
    </div>
  </Draggable>
)
