import type { Position, Size } from "../DraggableResizable/types"

export type PanelId = "taggingPanel" | "timelinePanel"
export type PanelLayout = { position: Position; size: Size }
export type LayoutMode = "wide" | "narrow"
export type SavedLayouts = Partial<
  Record<LayoutMode, Partial<Record<PanelId, PanelLayout>>>
>

export const LAYOUT_KEY = "youCoder.panelLayout.v2"
export const WIDE_WORKSPACE = 900
export const PANEL_GAP = 16
export const TAGGING_WIDTH = 380
export const TAGGING_HEIGHT = 320
export const TIMELINE_HEIGHT = 340
export const WIDE_HEIGHT = 420
export const MIN_PANEL_WIDTH = 280
export const MIN_PANEL_HEIGHT = 160

export const workspaceBounds = (width: number): Size => ({
  width: Math.max(1, width),
  height:
    width >= WIDE_WORKSPACE
      ? WIDE_HEIGHT
      : TAGGING_HEIGHT + PANEL_GAP + TIMELINE_HEIGHT
})

export const defaultPanelLayout = (id: PanelId, bounds: Size): PanelLayout => {
  const wide = bounds.width >= WIDE_WORKSPACE
  return id === "taggingPanel"
    ? {
        position: { x: 0, y: 0 },
        size: {
          width: wide ? TAGGING_WIDTH : bounds.width,
          height: wide ? WIDE_HEIGHT : TAGGING_HEIGHT
        }
      }
    : {
        position: {
          x: wide ? TAGGING_WIDTH + PANEL_GAP : 0,
          y: wide ? 0 : TAGGING_HEIGHT + PANEL_GAP
        },
        size: {
          width: wide ? bounds.width - TAGGING_WIDTH - PANEL_GAP : bounds.width,
          height: wide ? WIDE_HEIGHT : TIMELINE_HEIGHT
        }
      }
}

const validPair = (value: unknown, keys: string[]): boolean =>
  typeof value === "object" &&
  value !== null &&
  keys.every((key) => Number.isFinite(value[key]))

export const validLayout = (value: unknown): value is PanelLayout => {
  const layout = value as PanelLayout
  return (
    !!layout &&
    validPair(layout.position, ["x", "y"]) &&
    validPair(layout.size, ["width", "height"]) &&
    layout.size.width > 0 &&
    layout.size.height > 0
  )
}

export const fitPanel = (
  layout: PanelLayout,
  bounds: Size,
  minWidth = MIN_PANEL_WIDTH,
  minHeight = MIN_PANEL_HEIGHT
): PanelLayout => {
  const width = Math.min(bounds.width, Math.max(minWidth, layout.size.width))
  const height = Math.min(
    bounds.height,
    Math.max(minHeight, layout.size.height)
  )
  return {
    size: { width, height },
    position: {
      x: Math.max(0, Math.min(layout.position.x, bounds.width - width)),
      y: Math.max(0, Math.min(layout.position.y, bounds.height - height))
    }
  }
}

export const parseLayouts = (raw: string | null): SavedLayouts => {
  try {
    const parsed = JSON.parse(raw || "{}")
    const result: SavedLayouts = {}
    for (const mode of ["wide", "narrow"] as const) {
      for (const id of ["taggingPanel", "timelinePanel"] as const) {
        const layout = parsed?.[mode]?.[id]
        if (validLayout(layout)) {
          result[mode] ||= {}
          result[mode][id] = layout
        }
      }
    }
    return result
  } catch {
    return {}
  }
}
