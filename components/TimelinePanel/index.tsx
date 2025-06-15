import React, { useCallback, useState } from "react"
import Draggable from "react-draggable"

import { TimelineActions } from "~components/TimelineActions"
import { TimelineTable } from "~components/TimelineTable"
import { exportActionsToCSV } from "~lib/actionsManager"

import type { FilterConfig, SortConfig, TimelinePanelProps } from "./types"

// リサイズの方向を定義
type ResizeDirection = "" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

// マジックナンバーを定数として定義
const MIN_WIDTH = 300
const MIN_HEIGHT = 200
const RESIZE_EDGE = 8

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
  const [size, setSize] = useState({ width: 600, height: 400 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>("")
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    left: 0,
    top: 0
  })

  // リサイズ方向に応じたカーソルスタイルを取得
  const getResizeCursor = (direction: ResizeDirection): string => {
    switch (direction) {
      case "n":
      case "s":
        return "ns-resize"
      case "e":
      case "w":
        return "ew-resize"
      case "ne":
      case "sw":
        return "nesw-resize"
      case "nw":
      case "se":
        return "nwse-resize"
      default:
        return "default"
    }
  }

  // マウスの位置からリサイズ方向を判定
  const getResizeDirection = useCallback(
    (e: React.MouseEvent): ResizeDirection => {
      const panel = e.currentTarget as HTMLElement
      const rect = panel.getBoundingClientRect()

      const isNorth = e.clientY < rect.top + RESIZE_EDGE
      const isSouth = e.clientY > rect.bottom - RESIZE_EDGE
      const isWest = e.clientX < rect.left + RESIZE_EDGE
      const isEast = e.clientX > rect.right - RESIZE_EDGE

      if (isNorth && isWest) return "nw"
      if (isNorth && isEast) return "ne"
      if (isSouth && isWest) return "sw"
      if (isSouth && isEast) return "se"
      if (isNorth) return "n"
      if (isSouth) return "s"
      if (isWest) return "w"
      if (isEast) return "e"
      return ""
    },
    []
  )

  // マウスの移動を監視してリサイズを処理
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newLeft = resizeStart.left
      let newTop = resizeStart.top

      // 水平方向のリサイズ処理
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX)
      } else if (resizeDirection.includes("w")) {
        const possibleWidth = Math.max(MIN_WIDTH, resizeStart.width - deltaX)
        if (possibleWidth !== resizeStart.width) {
          newWidth = possibleWidth
          newLeft = resizeStart.left + (resizeStart.width - possibleWidth)
        }
      }

      // 垂直方向のリサイズ処理
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY)
      } else if (resizeDirection.includes("n")) {
        const possibleHeight = Math.max(MIN_HEIGHT, resizeStart.height - deltaY)
        if (possibleHeight !== resizeStart.height) {
          newHeight = possibleHeight
          newTop = resizeStart.top + (resizeStart.height - possibleHeight)
        }
      }

      setSize({ width: newWidth, height: newHeight })
      setPosition({ x: newLeft, y: newTop })
    },
    [isResizing, resizeDirection, resizeStart]
  )

  // リサイズ終了時の処理
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizeDirection("")
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseMove])

  // リサイズ開始時の処理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const direction = getResizeDirection(e)
      if (direction) {
        e.preventDefault()
        e.stopPropagation()
        const panel = e.currentTarget as HTMLElement
        const rect = panel.getBoundingClientRect()

        setIsResizing(true)
        setResizeDirection(direction)
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: rect.width,
          height: rect.height,
          left: position.x,
          top: position.y
        })

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
      }
    },
    [getResizeDirection, handleMouseMove, handleMouseUp, position]
  )

  // ドラッグ終了時の位置を更新
  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y })
  }

  // マウスの位置に応じてカーソルを更新
  const handleMouseMove_Cursor = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isResizing) {
        const direction = getResizeDirection(e)
        const target = e.currentTarget as HTMLDivElement
        target.style.cursor = getResizeCursor(direction)
      }
    },
    [getResizeDirection, isResizing]
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
    <Draggable
      handle=".panel-header"
      position={position}
      onStop={handleDragStop}
      disabled={isResizing}>
      <div
        id="timeline-panel"
        className="timeline-panel"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          position: "fixed",
          zIndex: 1000,
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e2e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          overflow: "hidden"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove_Cursor}>
        <div
          className="panel-header p-4 bg-gray-50 border-b border-gray-200"
          style={{ cursor: "grab" }}>
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
        </div>

        <div className="panel-content p-4">
          {filterConfig && (
            <button
              onClick={() => setFilterConfig(undefined)}
              className="bg-gray-100 text-gray-700 rounded px-2 py-1 text-sm hover:bg-gray-200 transition-colors mb-4">
              フィルターをクリア
            </button>
          )}

          <div
            className="overflow-y-auto"
            style={{ height: `${size.height - 140}px` }}>
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
      </div>
    </Draggable>
  )
}
