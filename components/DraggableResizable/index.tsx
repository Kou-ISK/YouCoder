import React, { useEffect, useRef, useState } from "react"

import type { DraggableResizableProps, Position, Size } from "./types"

export const DraggableResizable: React.FC<DraggableResizableProps> = ({
  initialPosition,
  initialSize,
  minWidth = 200,
  minHeight = 200,
  className = "",
  style = {},
  onPositionChange,
  onSizeChange,
  children
}) => {
  const [size, setSize] = useState<Size>(initialSize)
  const [position, setPosition] = useState<Position>(initialPosition)
  const elementRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })

  // マウスイベントハンドラ
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      e.preventDefault()

      // 直接位置を更新（requestAnimationFrameを使わない）
      const newPosition = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      }

      // 画面境界チェック
      const currentSize = elementRef.current
        ? {
            width: elementRef.current.clientWidth,
            height: elementRef.current.clientHeight
          }
        : size

      const maxX = window.innerWidth - currentSize.width
      const maxY = window.innerHeight - currentSize.height

      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX))
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY))

      setPosition(newPosition)
      onPositionChange?.(newPosition)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        e.preventDefault()
      }
    }

    // イベントリスナーを常に登録（isDraggingの状態に関係なく）
    document.addEventListener("mousemove", handleMouseMove, {
      passive: false
    })
    document.addEventListener("mouseup", handleMouseUp, {
      passive: false
    })

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [onPositionChange, size])

  const handleMouseDown = (e: React.MouseEvent) => {
    // リサイズハンドルかチェック
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return

    const isResizeArea =
      e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20

    if (!isResizeArea) {
      isDragging.current = true
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }

      // ドラッグ開始時にカーソルとユーザー選択を設定
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"

      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleResizeEnd = () => {
    if (elementRef.current) {
      const newSize = {
        width: Math.max(minWidth, elementRef.current.clientWidth),
        height: Math.max(minHeight, elementRef.current.clientHeight)
      }
      setSize(newSize)
      onSizeChange?.(newSize)
    }
  }

  return (
    <div
      ref={elementRef}
      className={`fixed ${className}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: minWidth,
        minHeight: minHeight,
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        resize: "both",
        overflow: "hidden",
        cursor: isDragging.current ? "grabbing" : "grab",
        userSelect: "none",
        zIndex: isDragging.current ? 9999 : "auto",
        ...style
      }}
      onMouseDown={handleMouseDown}
      onResize={handleResizeEnd}>
      {children}
    </div>
  )
}
