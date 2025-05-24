import React from "react"

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
      margin: "0 5px 5px 0",
      padding: "5px 10px",
      backgroundColor: isActive ? "#dc3545" : "#e9ecef",
      color: isActive ? "white" : "black",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer"
    }}>
    {team} {action}
  </button>
)
