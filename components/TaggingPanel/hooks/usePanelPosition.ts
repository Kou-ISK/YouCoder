import { useCallback, useEffect, useState } from "react"

import type { Position, Size } from "~components/DraggableResizable/types"

interface UsePanelPositionProps {
  storageKey?: string
  defaultPosition?: Position
  defaultSize?: Size
}

interface UsePanelPositionReturn {
  position: Position
  size: Size
  setPosition: (position: Position) => void
  setSize: (size: Size) => void
  handlePositionChange: (position: Position) => void
  handleSizeChange: (size: Size) => void
}

export const usePanelPosition = ({
  storageKey = "taggingPanel",
  defaultPosition,
  defaultSize
}: UsePanelPositionProps = {}): UsePanelPositionReturn => {
  // 初期位置とサイズの計算
  const getInitialPosition = (): Position => {
    if (defaultPosition) return defaultPosition

    // window オブジェクトが存在しない場合のデフォルト値
    if (typeof window === "undefined") {
      return { x: 100, y: 16 }
    }

    return {
      x: Math.max(0, window.innerWidth - 340), // 右端から340px（パネル幅+マージン）
      y: 16 // 上から16px
    }
  }

  const getInitialSize = (): Size => {
    if (defaultSize) return defaultSize

    // window オブジェクトが存在しない場合のデフォルト値
    if (typeof window === "undefined") {
      return { width: 320, height: 400 }
    }

    return {
      width: 320,
      height: Math.min(600, window.innerHeight - 100) // 画面高さに応じて調整
    }
  }

  const [position, setPosition] = useState<Position>(getInitialPosition)
  const [size, setSize] = useState<Size>(getInitialSize)

  // 位置変更のハンドラー
  const handlePositionChange = useCallback(
    (newPosition: Position) => {
      setPosition(newPosition)
      try {
        localStorage.setItem(
          `${storageKey}_position`,
          JSON.stringify(newPosition)
        )
      } catch (e) {
        console.warn("Failed to save position to localStorage:", e)
      }
    },
    [storageKey]
  )

  // サイズ変更のハンドラー
  const handleSizeChange = useCallback(
    (newSize: Size) => {
      setSize(newSize)
      try {
        localStorage.setItem(`${storageKey}_size`, JSON.stringify(newSize))
      } catch (e) {
        console.warn("Failed to save size to localStorage:", e)
      }
    },
    [storageKey]
  )

  // ローカルストレージから保存された位置とサイズを復元
  useEffect(() => {
    // window オブジェクトが存在しない場合は何もしない
    if (typeof window === "undefined") return

    try {
      const savedPosition = localStorage.getItem(`${storageKey}_position`)
      const savedSize = localStorage.getItem(`${storageKey}_size`)

      if (savedPosition) {
        const parsedPosition = JSON.parse(savedPosition)
        // 画面外に出ていないかチェック
        const isValidPosition =
          parsedPosition.x >= -280 && // パネル幅の80%は画面内に
          parsedPosition.x <= window.innerWidth - 40 && // 右端40px以内
          parsedPosition.y >= -20 && // 上部20px以内
          parsedPosition.y <= window.innerHeight - 40 // 下部40px以内

        if (isValidPosition) {
          setPosition(parsedPosition)
        }
      }

      if (savedSize) {
        const parsedSize = JSON.parse(savedSize)
        // 最小サイズチェック
        const isValidSize =
          parsedSize.width >= 280 &&
          parsedSize.height >= 200 &&
          parsedSize.width <= window.innerWidth &&
          parsedSize.height <= window.innerHeight

        if (isValidSize) {
          setSize(parsedSize)
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved position/size:", e)
    }
  }, [storageKey])

  // ウィンドウリサイズ時の処理
  useEffect(() => {
    // window オブジェクトが存在しない場合は何もしない
    if (typeof window === "undefined") return

    const handleWindowResize = () => {
      // 現在の位置が画面外に出た場合の調整
      setPosition((current) => {
        const maxX = window.innerWidth - 40
        const maxY = window.innerHeight - 40

        return {
          x: Math.max(-280, Math.min(current.x, maxX)),
          y: Math.max(-20, Math.min(current.y, maxY))
        }
      })

      // サイズが画面サイズを超えた場合の調整
      setSize((current) => ({
        width: Math.min(current.width, window.innerWidth),
        height: Math.min(current.height, window.innerHeight)
      }))
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [])

  return {
    position,
    size,
    setPosition,
    setSize,
    handlePositionChange,
    handleSizeChange
  }
}
