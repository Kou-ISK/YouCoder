import { useCallback, useEffect, useState } from "react"

import type { Position, Size } from "~components/DraggableResizable/types"

interface UseTimelinePanelPositionProps {
  storageKey?: string
}

interface UseTimelinePanelPositionReturn {
  position: Position
  size: Size
  handlePositionChange: (position: Position) => void
  handleSizeChange: (size: Size) => void
}

/**
 * TimelinePanelの位置とサイズ管理を担当するカスタムフック
 * 画面下部に固定された初期位置を持つ
 */
export const useTimelinePanelPosition = ({
  storageKey = "timelinePanel"
}: UseTimelinePanelPositionProps = {}): UseTimelinePanelPositionReturn => {
  // 初期位置とサイズの計算 - 画面下部に完全密着
  const getInitialPosition = (): Position => {
    if (typeof window === "undefined") {
      return { x: 0, y: 620 } // SSR対応のデフォルト値
    }
    return {
      x: 0,
      y: window.innerHeight - 180
    }
  }

  const getInitialSize = (): Size => {
    if (typeof window === "undefined") {
      return { width: 1200, height: 180 } // SSR対応のデフォルト値
    }
    return {
      width: window.innerWidth,
      height: 180
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
    if (typeof window === "undefined") return

    try {
      const savedPosition = localStorage.getItem(`${storageKey}_position`)
      const savedSize = localStorage.getItem(`${storageKey}_size`)

      if (savedPosition) {
        const parsedPosition = JSON.parse(savedPosition)
        // タイムラインパネルは下部固定が基本だが、ユーザーが移動した場合は尊重
        const isValidPosition =
          parsedPosition.x >= -size.width + 100 && // パネル幅の一部は画面内に
          parsedPosition.x <= window.innerWidth - 100 && // 右端100px以内
          parsedPosition.y >= -100 && // 上部100px以内
          parsedPosition.y <= window.innerHeight - 40 // 下部40px以内

        if (isValidPosition) {
          setPosition(parsedPosition)
        }
      }

      if (savedSize) {
        const parsedSize = JSON.parse(savedSize)
        // 最小サイズチェック
        const isValidSize =
          parsedSize.width >= 300 &&
          parsedSize.height >= 180 &&
          parsedSize.width <= window.innerWidth * 1.2 && // 画面幅の120%まで許可
          parsedSize.height <= window.innerHeight

        if (isValidSize) {
          setSize(parsedSize)
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved position/size:", e)
    }
  }, [storageKey, size.width])

  // ウィンドウリサイズ時の処理
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleWindowResize = () => {
      // タイムラインパネルは基本的に画面幅に合わせて調整
      setSize((current) => ({
        width: Math.max(300, Math.min(current.width, window.innerWidth)),
        height: Math.max(180, Math.min(current.height, window.innerHeight))
      }))

      // 位置も画面サイズに合わせて調整
      setPosition((current) => {
        const maxX = window.innerWidth - 100
        const maxY = window.innerHeight - 40

        return {
          x: Math.max(-size.width + 100, Math.min(current.x, maxX)),
          y: Math.max(-100, Math.min(current.y, maxY))
        }
      })
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [size.width])

  return {
    position,
    size,
    handlePositionChange,
    handleSizeChange
  }
}
