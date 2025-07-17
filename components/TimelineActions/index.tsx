import React from "react"

import { STYLES } from "../../constants"
import type { FilterConfig, TimelineActionsProps } from "../../types/components"

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
    <div className="flex gap-3 items-center w-full justify-between">
      {/* ボタングループ */}
      <div className="flex gap-2 items-center">
        <button
          onClick={onExportCSV}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="flex-shrink-0">
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
          className="btn-success flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="flex-shrink-0">
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
            className="flex gap-1.5 items-center select-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}>
            {/* チームフィルター */}
            <select
              value={filterConfig.team || ""}
              onChange={(e) => onFilterChange("team", e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="filter-select min-w-20 text-xs">
              <option value="" className="text-gray-400">
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
              className="filter-select min-w-24 text-xs">
              <option value="" className="text-gray-400">
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
              className="filter-select min-w-20 text-xs">
              <option value="" className="text-gray-400">
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
                className="btn-danger px-2 py-1 text-xs font-medium"
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
