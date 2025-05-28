import React from "react"

interface TimelineActionsProps {
  onSave: () => void
  exportActionsToCSV: () => void
}

const TimelineActions: React.FC<TimelineActionsProps> = ({
  onSave,
  exportActionsToCSV
}) => {
  return (
    <div>
      <button
        onClick={exportActionsToCSV}
        style={{
          padding: "6px 12px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "13px",
          marginRight: "10px"
        }}>
        CSV出力
      </button>
      <button
        onClick={onSave}
        style={{
          padding: "6px 12px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "13px"
        }}>
        保存
      </button>
    </div>
  )
}

export default TimelineActions
