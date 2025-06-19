import React, { useEffect, useRef, useState } from "react"

import { DraggableResizable } from "../DraggableResizable"
import { TimelineActions } from "../TimelineActions"
import { TimelineTable } from "../TimelineTable"
import type {
  Action,
  FilterConfig,
  SortConfig,
  TimelinePanelProps
} from "./types"

const MIN_WIDTH = 500
const MIN_HEIGHT = 300
const INITIAL_POSITION = { x: 200, y: 600 }
const INITIAL_SIZE = { width: 800, height: 400 }

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave,
  onExportCSV,
  onSeek,
  defaultSort,
  defaultFilter
}) => {
  console.log(
    `[TimelinePanel] レンダリング開始 - 受信アクション数: ${actions.length}`
  )

  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSort
  )
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(
    defaultFilter || {}
  )
  const tableRef = useRef<HTMLDivElement>(null)
  const prevActionsRef = useRef<Action[]>([])

  // タイムラインの自動スクロール - 新しいアクションが追加された時のみ
  useEffect(() => {
    if (!tableRef.current) return

    const isNewActionAdded = actions.length > prevActionsRef.current.length
    const container = tableRef.current
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50

    if (isNewActionAdded && isNearBottom) {
      // アニメーションフレームを使用して、DOMの更新後に確実にスクロール
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth"
            })
          }
        }, 100) // 少し遅延を入れてDOMの更新を待つ
      })
    }

    prevActionsRef.current = [...actions]
  }, [actions])

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
      className="rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 transition-all duration-300 ease-in-out hover:shadow-2xl"
      style={{
        zIndex: 10000,
        borderRadius: "8px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column"
      }}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
        <div
          className="timeline-actions flex items-center justify-between border-b border-gray-100/60 bg-gradient-to-r from-white/80 via-white/60 to-gray-50/40 backdrop-blur-sm cursor-grab"
          style={{
            padding: "5px 5px",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            flexShrink: 0,
            minHeight: "30px"
          }}>
          <TimelineActions onExportCSV={onExportCSV} onSave={onSave} />
        </div>
        <div
          ref={tableRef}
          className="timeline-content bg-white/95 cursor-default"
          style={{
            flex: 1,
            overflow: "hidden",
            padding: "8px",
            minHeight: 0 // フレックスアイテムが縮小可能にする
          }}>
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
