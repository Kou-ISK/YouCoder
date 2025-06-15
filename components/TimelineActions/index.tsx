import React from "react"

interface TimelineActionsProps {
  onSave?: () => void
  onExportCSV?: () => void
}

const TimelineActions: React.FC<TimelineActionsProps> = ({
  onSave,
  onExportCSV
}) => {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={onExportCSV}
        style={{
          padding: "6px 12px",
          backgroundColor: "#6366f1",
          color: "white",
          border: "1px solid #6366f1",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#4f46e5"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#6366f1"
        }}>
        CSV出力
      </button>
      <button
        onClick={onSave}
        style={{
          padding: "6px 12px",
          backgroundColor: "rgb(16, 185, 129)",
          color: "rgb(255, 255, 255)",
          border: "1px solid #10b981",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#059669"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#10b981"
        }}>
        保存
      </button>
    </div>
  )
}

export { TimelineActions }
export type { TimelineActionsProps }
