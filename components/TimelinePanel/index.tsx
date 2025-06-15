import React, { useEffect, useRef, useState } from "react"

import { TimelineActions } from "../TimelineActions"
import { TimelineTable } from "../TimelineTable"
import type { FilterConfig, SortConfig, TimelinePanelProps } from "./types"

const MIN_WIDTH = 400
const MIN_HEIGHT = 200
const INITIAL_POSITION = { x: 200, y: 600 }

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
  const [size, setSize] = useState({ width: 600, height: 200 })
  const [position, setPosition] = useState(INITIAL_POSITION)
  const tableRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  // タイムラインの自動スクロール
  useEffect(() => {
    if (actions.length > 0 && tableRef.current) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight
    }
  }, [actions.length])

  // グローバルマウスイベントの設定
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const newX = e.clientX - dragStartRef.current.x
        const newY = e.clientY - dragStartRef.current.y

        // スクロール可能な領域を考慮した制限
        const maxX =
          Math.max(document.documentElement.scrollWidth, window.innerWidth) -
          (size.width || MIN_WIDTH)
        const maxY =
          Math.max(document.documentElement.scrollHeight, window.innerHeight) -
          (size.height || MIN_HEIGHT)

        // パネルが完全に画面外に出ないよう、少なくとも20pxは画面内に残す
        const safeArea = 20
        setPosition({
          x: Math.max(-size.width + safeArea, Math.min(newX, maxX)),
          y: Math.max(-size.height + safeArea, Math.min(newY, maxY))
        })
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
      }
    }

    // スクロール処理の追加
    const handleScroll = () => {
      if (isDraggingRef.current) {
        const rect = panelRef.current?.getBoundingClientRect()
        if (rect) {
          // スクロール位置が変わった時もパネルの相対位置を維持
          setPosition((prev) => ({
            x: prev.x - (window.scrollX - (window as any).lastScrollX || 0),
            y: prev.y - (window.scrollY - (window as any).lastScrollY || 0)
          }))
        }
      }
      ;(window as any).lastScrollX = window.scrollX
      ;(window as any).lastScrollY = window.scrollY
    }

    window.addEventListener("mousemove", handleGlobalMouseMove)
    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove)
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [size])

  // パネルが画面外に出た時の自動スクロール
  useEffect(() => {
    if (!isDraggingRef.current) return

    const checkAndScroll = () => {
      const rect = panelRef.current?.getBoundingClientRect()
      if (!rect) return

      const scrollSpeed = 10
      const scrollThreshold = 50
      const isPartiallyOutOfView =
        rect.bottom > window.innerHeight ||
        rect.top < 0 ||
        rect.right > window.innerWidth ||
        rect.left < 0

      // パネルが一部でも画面外に出ている場合のみスクロール
      if (isPartiallyOutOfView) {
        if (
          rect.bottom > window.innerHeight - scrollThreshold &&
          rect.bottom > window.innerHeight
        ) {
          window.scrollBy(0, scrollSpeed)
        } else if (rect.top < scrollThreshold && rect.top < 0) {
          window.scrollBy(0, -scrollSpeed)
        }

        if (
          rect.right > window.innerWidth - scrollThreshold &&
          rect.right > window.innerWidth
        ) {
          window.scrollBy(scrollSpeed, 0)
        } else if (rect.left < scrollThreshold && rect.left < 0) {
          window.scrollBy(-scrollSpeed, 0)
        }
      }
    }

    const scrollInterval = setInterval(checkAndScroll, 50)
    return () => clearInterval(scrollInterval)
  }, [isDraggingRef.current])

  const handleMouseDown = (e: React.MouseEvent) => {
    // ドラッグ可能な領域の判定
    const isDraggableArea = () => {
      const isTimelineContent = (e.target as HTMLElement).closest(
        ".timeline-content"
      )
      const isButton = (e.target as HTMLElement).closest("button")
      const isResizeHandle = (e: React.MouseEvent) => {
        const rect = panelRef.current?.getBoundingClientRect()
        if (!rect) return false
        const rightEdge = rect.right - e.clientX
        const bottomEdge = rect.bottom - e.clientY
        return rightEdge <= 20 && bottomEdge <= 20
      }

      // ボタンの横のスペースはドラッグ可能に
      const isButtonArea = (e.target as HTMLElement).closest(
        ".timeline-actions"
      )
      const isActualButton = isButton && !isButtonArea

      return !isTimelineContent && !isActualButton && !isResizeHandle(e)
    }

    if (isDraggableArea()) {
      isDraggingRef.current = true
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.preventDefault()
    }
  }

  const handleResizeEnd = () => {
    if (panelRef.current) {
      const newWidth = panelRef.current.clientWidth
      const newHeight = panelRef.current.clientHeight

      setSize({
        width: Math.max(MIN_WIDTH, newWidth),
        height: Math.max(MIN_HEIGHT, newHeight)
      })
    }
  }

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
    <div
      ref={panelRef}
      className="timeline-panel fixed rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]border border-gray-100/40 transition-all duration-300 ease-in-out hover:shadow-2xl"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000,
        overflow: "hidden",
        resize: "both",
        cursor: isDraggingRef.current ? "grabbing" : "grab",
        borderRadius: "5px",
        userSelect: "none",
        backgroundColor: "white"
      }}
      onMouseDown={handleMouseDown}
      onResize={handleResizeEnd}>
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
      <div
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize rounded-tl-2xl overflow-hidden transform transition-all duration-200 hover:bg-gray-100/60"
        style={{
          pointerEvents: "auto",
          touchAction: "none"
        }}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "linear-gradient(135deg, transparent 40%, rgb(243, 244, 246) 41%)"
          }}
        />
        <div className="absolute right-2 bottom-2 w-2.5 h-2.5 border-r-2 border-b-2 border-gray-400/80" />
      </div>
    </div>
  )
}
