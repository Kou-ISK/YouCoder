interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

export interface DraggableResizableProps {
  initialPosition: Position
  initialSize: Size
  minWidth?: number
  minHeight?: number
  className?: string
  style?: React.CSSProperties
  onPositionChange?: (position: Position) => void
  onSizeChange?: (size: Size) => void
  children: React.ReactNode
}

export type { Position, Size }
