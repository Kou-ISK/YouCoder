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
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<Position>({ x: 0, y: 0 })

  // グローバルマウスイベントの設定
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const newX = e.clientX - dragStartRef.current.x
        const newY = e.clientY - dragStartRef.current.y

        // スクロール可能な領域を考慮した制限
        const maxX =
          Math.max(document.documentElement.scrollWidth, window.innerWidth) -
          (size.width || minWidth)
        const maxY =
          Math.max(document.documentElement.scrollHeight, window.innerHeight) -
          (size.height || minHeight)

        // 要素が完全に画面外に出ないよう、少なくとも20pxは画面内に残す
        const safeArea = 20
        const newPosition = {
          x: Math.max(-size.width + safeArea, Math.min(newX, maxX)),
          y: Math.max(-size.height + safeArea, Math.min(newY, maxY))
        }

        setPosition(newPosition)
        onPositionChange?.(newPosition)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
      }
    }

    // スクロール処理
    const handleScroll = () => {
      if (isDraggingRef.current) {
        const rect = elementRef.current?.getBoundingClientRect()
        if (rect) {
          const newPosition = {
            x: position.x - (window.scrollX - (window as any).lastScrollX || 0),
            y: position.y - (window.scrollY - (window as any).lastScrollY || 0)
          }
          setPosition(newPosition)
          onPositionChange?.(newPosition)
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
  }, [size, minWidth, minHeight, onPositionChange])

  // 画面外に出た時の自動スクロール
  useEffect(() => {
    if (!isDraggingRef.current) return

    const checkAndScroll = () => {
      const rect = elementRef.current?.getBoundingClientRect()
      if (!rect) return

      const scrollSpeed = 10
      const scrollThreshold = 50
      const isPartiallyOutOfView =
        rect.bottom > window.innerHeight ||
        rect.top < 0 ||
        rect.right > window.innerWidth ||
        rect.left < 0

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
    // リサイズハンドルをクリックした場合はドラッグを開始しない
    const isResizeHandle = (e: React.MouseEvent) => {
      const rect = elementRef.current?.getBoundingClientRect()
      if (!rect) return false
      const rightEdge = rect.right - e.clientX
      const bottomEdge = rect.bottom - e.clientY
      return rightEdge <= 20 && bottomEdge <= 20
    }

    if (!isResizeHandle(e)) {
      isDraggingRef.current = true
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.preventDefault()
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
        cursor: isDraggingRef.current ? "grabbing" : "grab",
        userSelect: "none",
        ...style
      }}
      onMouseDown={handleMouseDown}
      onResize={handleResizeEnd}>
      {children}
    </div>
  )
}
