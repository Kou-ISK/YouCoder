import React, { useState } from "react"
import Draggable from "react-draggable"

import { TimelineActions } from "~components/TimelineActions"
import { TimelineTable } from "~components/TimelineTable"
import { exportActionsToCSV } from "~lib/actionsManager"

import type { FilterConfig, SortConfig, TimelinePanelProps } from "./types"

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave,
  onExportCSV,
  onSeek,
  defaultSort,
  defaultFilter
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSort
  )
  const [filterConfig, setFilterConfig] = useState<FilterConfig | undefined>(
    defaultFilter
  )

  // ソート設定を切り替える関数
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((currentSort) => {
      if (!currentSort || currentSort.key !== key) {
        return { key, direction: "asc" }
      }
      if (currentSort.direction === "asc") {
        return { key, direction: "desc" }
      }
      return undefined
    })
  }

  // フィルター設定を更新する関数
  const updateFilter = (newFilter: Partial<FilterConfig>) => {
    setFilterConfig((current) => ({
      ...current,
      ...newFilter
    }))
  }

  // フィルターをクリアする関数
  const clearFilter = () => {
    setFilterConfig(undefined)
  }

  return (
    <Draggable handle=".drag-handle">
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          width: "85%",
          maxWidth: "1200px",
          maxHeight: "300px",
          backgroundColor: "#ffffff",
          padding: "8px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          zIndex: 1000,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
        <div
          className="drag-handle"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "4px",
            marginBottom: "8px",
            cursor: "move"
          }}>
          <TimelineActions
            onSave={onSave || (() => {})}
            exportActionsToCSV={() => {
              if (onExportCSV) {
                onExportCSV()
              } else {
                exportActionsToCSV(actions)
              }
            }}
          />
          {filterConfig && (
            <button
              onClick={clearFilter}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer"
              }}>
              フィルターをクリア
            </button>
          )}
        </div>

        <div
          style={{
            overflowY: "auto",
            maxHeight: "200px"
          }}>
          <TimelineTable
            actions={actions}
            onDelete={onDelete}
            onSeek={onSeek}
            onSort={handleSort}
            sortConfig={sortConfig}
            filterConfig={filterConfig}
          />
        </div>
      </div>
    </Draggable>
  )
}
