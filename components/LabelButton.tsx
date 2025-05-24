import React from "react"

interface LabelButtonProps {
  label: string
  isActive: boolean
  isDisabled: boolean
  onClick: (label: string) => void
}

export const LabelButton: React.FC<LabelButtonProps> = ({
  label,
  isActive,
  isDisabled,
  onClick
}) => (
  <button
    onClick={() => onClick(label)}
    disabled={isDisabled}
    style={{
      margin: "0 5px 5px 0",
      padding: "5px 10px",
      backgroundColor: isActive ? "#28a745" : "#e9ecef",
      color: isActive ? "white" : "black",
      border: "none",
      borderRadius: "4px",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
      transition: "all 0.3s ease"
    }}>
    {label}
  </button>
)
