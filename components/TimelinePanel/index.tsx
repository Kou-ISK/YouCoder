import React, { useEffect, useRef, useState } from "react"

import { DraggableResizable } from "../DraggableResizable"
import { TimelineActions } from "../TimelineActions"
import { TimelineTable } from "../TimelineTable"
import type { FilterConfig, SortConfig, TimelinePanelProps } from "./types"

const MIN_WIDTH = 400
const MIN_HEIGHT = 200
const INITIAL_POSITION = { x: 200, y: 600 }
const INITIAL_SIZE = { width: 600, height: 200 }

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
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(
    defaultFilter || {}
  )
  const tableRef = useRef<HTMLDivElement>(null)

  // タイムラインの自動スクロール
  useEffect(() => {
    if (actions.length > 0 && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }, [actions.length])

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

  return (
    <DraggableResizable
      initialPosition={INITIAL_POSITION}
      initialSize={INITIAL_SIZE}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 transition-all duration-300 ease-in-out hover:shadow-2xl"
      style={{
        zIndex: 10000,
        borderRadius: "5px",
        backgroundColor: "white"
      }}>
      <div className="h-full">
        <div className="timeline-actions p-4 flex items-center justify-between border-b border-gray-100/60 bg-gradient-to-r from-white/80 via-white/60 to-gray-50/40 backdrop-blur-sm cursor-grab rounded-t-3xl">
          <div className="flex gap-2">
            <TimelineActions onExportCSV={onExportCSV} onSave={onSave} />
          </div>
          <div className="flex-grow"></div>
        </div>
        <div
          ref={tableRef}
          className="timeline-content px-4 pb-4 overflow-auto bg-white/95 cursor-default"
          style={{ height: "calc(100% - 64px)" }}>
          <TimelineTable
            actions={actions}
            onDelete={onDelete}
            onSeek={onSeek}
            sortConfig={sortConfig}
            onSort={handleSort}
            filterConfig={filterConfig}
          />
        </div>
      </div>
    </DraggableResizable>
  )
}
