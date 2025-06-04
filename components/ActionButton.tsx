import React from "react"

// ActionButtonコンポーネントは、アクションを表すボタンを提供します。
// - team: アクションが属するチーム名。
// - action: アクション名。
// - isActive: ボタンがアクティブかどうか。
// - onClick: ボタンがクリックされたときのコールバック。
interface ActionButtonProps {
  team: string
  action: string
  isActive: boolean
  onClick: (team: string, action: string) => void
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  team,
  action,
  isActive,
  onClick
}) => (
  <button
    onClick={() => onClick(team, action)}
    style={{
      margin: "0",
      padding: "3px 6px",
      backgroundColor: isActive ? "#ef4444" : "#ffffff",
      color: isActive ? "white" : "#374151",
      border: "1px solid",
      borderColor: isActive ? "#ef4444" : "#d1d5db",
      borderRadius: "3px",
      cursor: "pointer",
      fontSize: "10px",
      fontWeight: "500",
      transition: "all 0.12s ease",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      width: "100%",
      minWidth: "50px",
      textAlign: "center",
      lineHeight: "1.2"
    }}
    onMouseEnter={(e) => {
      if (isActive) {
        e.currentTarget.style.backgroundColor = "#dc2626"
      } else {
        e.currentTarget.style.backgroundColor = "#f8fafc"
        e.currentTarget.style.borderColor = "#94a3b8"
      }
    }}
    onMouseLeave={(e) => {
      if (isActive) {
        e.currentTarget.style.backgroundColor = "#ef4444"
      } else {
        e.currentTarget.style.backgroundColor = "#ffffff"
        e.currentTarget.style.borderColor = "#d1d5db"
      }
    }}>
    {action}
  </button>
)
