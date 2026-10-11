import React, { useRef, useState } from "react"

import { fitPanel, type PanelLayout } from "../AnalysisWorkspace/layout"
import type { DraggableResizableProps } from "./types"

const KEYBOARD_STEP = 10

export const DraggableResizable: React.FC<DraggableResizableProps> = ({
  initialPosition,
  initialSize,
  bounds = { width: 800, height: 800 },
  minWidth = 280,
  minHeight = 160,
  title = "パネル",
  className = "",
  style = {},
  onPositionChange,
  onSizeChange,
  children
}) => {
  const [preview, setPreview] = useState<PanelLayout | null>(null)
  const gesture = useRef<{
    pointerId: number
    x: number
    y: number
    mode: "move" | "resize"
    layout: PanelLayout
    latest: PanelLayout
  } | null>(null)
  const layout = fitPanel(
    preview || { position: initialPosition, size: initialSize },
    bounds,
    minWidth,
    minHeight
  )

  const commit = (next: PanelLayout, mode: "move" | "resize") => {
    if (mode === "move") onPositionChange?.(next.position)
    else onSizeChange?.(next.size)
  }
  const begin = (
    event: React.PointerEvent<HTMLButtonElement>,
    mode: "move" | "resize"
  ) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      mode,
      layout,
      latest: layout
    }
  }
  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    const dx = event.clientX - active.x,
      dy = event.clientY - active.y
    const next =
      active.mode === "move"
        ? {
            ...active.layout,
            position: {
              x: active.layout.position.x + dx,
              y: active.layout.position.y + dy
            }
          }
        : {
            ...active.layout,
            size: {
              width: Math.min(
                bounds.width - active.layout.position.x,
                active.layout.size.width + dx
              ),
              height: Math.min(
                bounds.height - active.layout.position.y,
                active.layout.size.height + dy
              )
            }
          }
    active.latest = fitPanel(next, bounds, minWidth, minHeight)
    setPreview(active.latest)
  }
  const end = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    commit(active.latest, active.mode)
    gesture.current = null
    setPreview(null)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const cancel = () => {
    gesture.current = null
    setPreview(null)
  }
  const keyboard = (event: React.KeyboardEvent, mode: "move" | "resize") => {
    if (event.key === "Escape") {
      cancel()
      return
    }
    const delta = {
      ArrowLeft: [-KEYBOARD_STEP, 0],
      ArrowRight: [KEYBOARD_STEP, 0],
      ArrowUp: [0, -KEYBOARD_STEP],
      ArrowDown: [0, KEYBOARD_STEP]
    }[event.key]
    if (!delta) return
    event.preventDefault()
    const [dx, dy] = delta
    const next =
      mode === "move"
        ? {
            ...layout,
            position: { x: layout.position.x + dx, y: layout.position.y + dy }
          }
        : {
            ...layout,
            size: {
              width: Math.min(
                bounds.width - layout.position.x,
                layout.size.width + dx
              ),
              height: Math.min(
                bounds.height - layout.position.y,
                layout.size.height + dy
              )
            }
          }
    commit(fitPanel(next, bounds, minWidth, minHeight), mode)
  }

  return (
    <div
      data-youcoder-panel={title}
      className={className}
      style={{
        ...style,
        position: "absolute",
        left: layout.position.x,
        top: layout.position.y,
        width: layout.size.width,
        height: layout.size.height,
        maxWidth: "100%",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}>
      <button
        type="button"
        aria-label={`${title}を移動`}
        title="ドラッグまたは矢印キーで移動"
        className="flex-shrink-0 cursor-move border-b border-slate-200 bg-white/90 px-3 py-2 text-left text-sm font-semibold text-slate-700"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => begin(e, "move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => keyboard(e, "move")}>
        {title} <span aria-hidden="true">⠿</span>
      </button>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      <button
        type="button"
        aria-label={`${title}のサイズを変更`}
        title="ドラッグまたは矢印キーでサイズ変更"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize rounded-tl bg-slate-200 text-slate-600"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => begin(e, "resize")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => keyboard(e, "resize")}>
        <span aria-hidden="true">◢</span>
      </button>
    </div>
  )
}
