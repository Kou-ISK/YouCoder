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
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <button
        onClick={onExportCSV}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow:
            "0 2px 4px rgba(59, 130, 246, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)",
          outline: "none",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2563eb"
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow =
            "0 4px 8px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#3b82f6"
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow =
            "0 2px 4px rgba(59, 130, 246, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)"
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(59, 130, 246, 0.3)"
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = "2px solid #3b82f6"
          e.currentTarget.style.outlineOffset = "2px"
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none"
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{ flexShrink: 0 }}>
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14,2 14,8 20,8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        CSV出力
      </button>
      <button
        onClick={onSave}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow:
            "0 2px 4px rgba(16, 185, 129, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)",
          outline: "none",
          position: "relative"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#059669"
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow =
            "0 4px 8px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#10b981"
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow =
            "0 2px 4px rgba(16, 185, 129, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)"
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(16, 185, 129, 0.3)"
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)"
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = "2px solid #10b981"
          e.currentTarget.style.outlineOffset = "2px"
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none"
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          style={{ flexShrink: 0 }}>
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="17,21 17,13 7,13 7,21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="7,3 7,8 15,8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        保存
      </button>
    </div>
  )
}

export { TimelineActions }
export type { TimelineActionsProps }
