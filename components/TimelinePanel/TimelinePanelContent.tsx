import React from "react"

import { TimelineActions } from "../TimelineActions"
import { TimelineTable } from "../TimelineTable"
import type { Action, FilterConfig, SortConfig } from "./types"

interface TimelinePanelContentProps {
  actions: Action[]
  onDelete?: (team: string, action: string, start: number) => void
  onSeek?: (timestamp: number) => void
  sortConfig: SortConfig | undefined
  filterConfig: FilterConfig
  showScrollToBottom: boolean
  newActionIndicator: boolean
  tableRef: React.RefObject<HTMLDivElement>
  scrollContainerRef: React.RefObject<HTMLDivElement>
  handleSort: (key: SortConfig["key"]) => void
  handleFilterChange: (key: keyof FilterConfig, value: string) => void
  handleFilterReset: () => void
  getUniqueTeams: () => string[]
  getUniqueActions: () => string[]
  getUniqueLabels: () => string[]
  scrollToBottom: () => void
  onExportCSV?: () => void
  onSave?: () => void
}

/**
 * TimelinePanelのコンテンツ部分を担当するコンポーネント
 * DraggableResizableに依存しない純粋なUIコンポーネント
 */
export const TimelinePanelContent: React.FC<TimelinePanelContentProps> = ({
  actions,
  onDelete,
  onSeek,
  sortConfig,
  filterConfig,
  showScrollToBottom,
  newActionIndicator,
  tableRef,
  scrollContainerRef,
  handleSort,
  handleFilterChange,
  handleFilterReset,
  getUniqueTeams,
  getUniqueActions,
  getUniqueLabels,
  scrollToBottom,
  onExportCSV,
  onSave
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className="timeline-actions flex items-center justify-between border-b border-gray-100/60 bg-gradient-to-r from-white/80 via-white/60 to-gray-50/40 backdrop-blur-sm cursor-grab px-1.5 py-1.5 flex-shrink-0 relative"
        style={{
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          minHeight: "30px"
        }}>
        <TimelineActions
          onExportCSV={onExportCSV}
          onSave={onSave}
          filterConfig={filterConfig}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          getUniqueTeams={getUniqueTeams}
          getUniqueActions={getUniqueActions}
          getUniqueLabels={getUniqueLabels}
        />

        {/* 新しいアクションのインジケーター */}
        {newActionIndicator && (
          <div
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "#10b981",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              animation: "pulse 1s infinite",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)"
            }}>
            新しいアクション追加
          </div>
        )}
      </div>

      <div
        ref={tableRef}
        className="timeline-content bg-white/95 cursor-default flex-1 overflow-hidden p-2 relative"
        style={{
          minHeight: 0 // フレックスアイテムが縮小可能にする
        }}>
        <TimelineTable
          actions={actions}
          onDelete={onDelete}
          onSeek={onSeek}
          sortConfig={sortConfig}
          onSort={handleSort}
          filterConfig={filterConfig}
          scrollContainerRef={scrollContainerRef}
        />

        {/* 下部に移動ボタン */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              zIndex: 1000,
              transition: "all 0.2s ease",
              animation: "fadeIn 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb"
              e.currentTarget.style.transform = "scale(1.1)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6"
              e.currentTarget.style.transform = "scale(1)"
            }}
            title="最新のアクションに移動">
            ↓
          </button>
        )}
      </div>
    </div>
  )
}
