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
      padding: "4px 6px",
      backgroundColor: isActive ? "rgb(239, 68, 68)" : "rgb(255, 255, 255)",
      color: isActive ? "rgb(255, 255, 255)" : "rgb(55, 65, 81)",
      border: "1px solid",
      borderColor: isActive ? "rgb(239, 68, 68)" : "rgb(209, 213, 219)",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      transition: "all 0.12s ease",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      width: "100%",
      minWidth: "0",
      maxWidth: "100%",
      textAlign: "center",
      lineHeight: "1.4",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      boxSizing: "border-box"
    }}
    onMouseEnter={(e) => {
      if (isActive) {
        e.currentTarget.style.backgroundColor = "#dc2626"
      } else {
        e.currentTarget.style.backgroundColor = "rgb(248, 250, 252)"
        e.currentTarget.style.borderColor = "rgb(148, 163, 184)"
      }
    }}
    onMouseLeave={(e) => {
      if (isActive) {
        e.currentTarget.style.backgroundColor = "rgb(239, 68, 68)"
      } else {
        e.currentTarget.style.backgroundColor = "rgb(255, 255, 255)"
        e.currentTarget.style.borderColor = "rgb(209, 213, 219)"
      }
    }}>
    {action}
  </button>
)
