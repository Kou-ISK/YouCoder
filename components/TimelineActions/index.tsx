import React from "react"

interface FilterConfig {
  team?: string
  action?: string
  label?: string
  timeRange?: {
    start: number
    end: number
  }
}

interface TimelineActionsProps {
  onSave?: () => void
  onExportCSV?: () => void
  // フィルター関連のprops
  filterConfig?: FilterConfig
  onFilterChange?: (key: keyof FilterConfig, value: string) => void
  onFilterReset?: () => void
  getUniqueTeams?: () => string[]
  getUniqueActions?: () => string[]
  getUniqueLabels?: () => string[]
}

const TimelineActions: React.FC<TimelineActionsProps> = ({
  onSave,
  onExportCSV,
  filterConfig,
  onFilterChange,
  onFilterReset,
  getUniqueTeams,
  getUniqueActions,
  getUniqueLabels
}) => {
  // アクティブなフィルター数をカウント
  const getActiveFilterCount = () => {
    if (!filterConfig) return 0
    return Object.keys(filterConfig).filter(
      (key) => filterConfig[key as keyof FilterConfig]
    ).length
  }
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        width: "100%",
        justifyContent: "space-between"
      }}>
      {/* ボタングループ */}
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
            e.currentTarget.style.boxShadow =
              "0 1px 2px rgba(59, 130, 246, 0.3)"
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
            e.currentTarget.style.boxShadow =
              "0 1px 2px rgba(16, 185, 129, 0.3)"
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

      {/* フィルターグループ */}
      {filterConfig &&
        onFilterChange &&
        getUniqueTeams &&
        getUniqueActions &&
        getUniqueLabels && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              userSelect: "auto",
              pointerEvents: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}>
            {/* チームフィルター */}
            <select
              value={filterConfig.team || ""}
              onChange={(e) => onFilterChange("team", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
                minWidth: "90px",
                outline: "none",
                cursor: "pointer",
                backgroundColor: "white",
                color: "#334155",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94a3b8"
                e.currentTarget.style.backgroundColor = "#f8fafc"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.backgroundColor = "white"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6"
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59, 130, 246, 0.1)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}>
              <option value="" style={{ color: "#94a3b8" }}>
                全チーム
              </option>
              {getUniqueTeams().map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            {/* アクションフィルター */}
            <select
              value={filterConfig.action || ""}
              onChange={(e) => onFilterChange("action", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
                minWidth: "100px",
                outline: "none",
                cursor: "pointer",
                backgroundColor: "white",
                color: "#334155",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94a3b8"
                e.currentTarget.style.backgroundColor = "#f8fafc"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.backgroundColor = "white"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6"
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59, 130, 246, 0.1)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}>
              <option value="" style={{ color: "#94a3b8" }}>
                全アクション
              </option>
              {getUniqueActions().map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            {/* ラベルフィルター */}
            <select
              value={filterConfig.label || ""}
              onChange={(e) => onFilterChange("label", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
                minWidth: "90px",
                outline: "none",
                cursor: "pointer",
                backgroundColor: "white",
                color: "#334155",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94a3b8"
                e.currentTarget.style.backgroundColor = "#f8fafc"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.backgroundColor = "white"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6"
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(59, 130, 246, 0.1)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0"
                e.currentTarget.style.boxShadow =
                  "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}>
              <option value="" style={{ color: "#94a3b8" }}>
                全ラベル
              </option>
              {getUniqueLabels().map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>

            {/* フィルターリセットボタン */}
            {getActiveFilterCount() > 0 && onFilterReset && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFilterReset()
                }}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #f87171",
                  borderRadius: "6px",
                  fontSize: "11px",
                  backgroundColor: "white",
                  color: "#dc2626",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fef2f2"
                  e.currentTarget.style.borderColor = "#ef4444"
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(248, 113, 113, 0.2)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white"
                  e.currentTarget.style.borderColor = "#f87171"
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow =
                    "0 1px 2px rgba(0, 0, 0, 0.05)"
                }}
                title={`${getActiveFilterCount()}個のフィルターをリセット`}>
                リセット
              </button>
            )}
          </div>
        )}
    </div>
  )
}

export { TimelineActions }
export type { TimelineActionsProps }
