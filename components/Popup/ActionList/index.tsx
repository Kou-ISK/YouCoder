import React from "react"

import type { ActionListProps } from "../../../types/components"

export const ActionList: React.FC<ActionListProps> = ({
  actions,
  onAdd,
  onRemove
}) => (
  <div style={{ marginBottom: "20px" }}>
    <h3>アクション</h3>
    <button
      type="button"
      onClick={onAdd}
      style={{
        marginBottom: "10px",
        padding: "5px 10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}>
      アクションを追加
    </button>
    <div>
      {Object.keys(actions).map((action) => (
        <div
          key={action}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "5px",
            padding: "5px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px"
          }}>
          <span>{actions[action]}</span>
          <button
            type="button"
            onClick={() => onRemove(action)}
            style={{
              padding: "2px 8px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            削除
          </button>
        </div>
      ))}
    </div>
  </div>
)
