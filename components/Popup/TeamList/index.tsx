import React from "react"

import type { TeamListProps } from "../../../types/components"

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onAdd,
  onRemove
}) => (
  <div
    style={{
      marginBottom: "24px",
      padding: "16px",
      backgroundColor: "rgb(255, 255, 255)",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
    }}>
    <h3
      style={{
        margin: "0 0 12px 0",
        fontSize: "16px",
        fontWeight: "500",
        color: "#1f2937"
      }}>
      チーム
    </h3>
    <button
      onClick={onAdd}
      style={{
        marginBottom: "12px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: "500",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}>
      チームを追加
    </button>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {teams.map((team) => (
        <div
          key={team}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px"
          }}>
          <span style={{ fontSize: "14px", color: "#374151" }}>{team}</span>
          <button
            onClick={() => onRemove(team)}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "500",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#dc2626")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#ef4444")
            }>
            削除
          </button>
        </div>
      ))}
    </div>
  </div>
)
