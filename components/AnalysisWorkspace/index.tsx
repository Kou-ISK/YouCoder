import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import type { Position, Size } from "../DraggableResizable/types"
import {
  arrangePanels,
  defaultPanelLayout,
  LAYOUT_KEY,
  parseLayouts,
  WIDE_WORKSPACE,
  workspaceBounds,
  type PanelId,
  type PanelLayout,
  type SavedLayouts
} from "./layout"

interface WorkspaceContextValue {
  bounds: Size
  layouts: Record<PanelId, PanelLayout>
  update: (id: PanelId, change: Partial<PanelLayout>) => void
}
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
const readLayouts = () => {
  try {
    return parseLayouts(localStorage.getItem(LAYOUT_KEY))
  } catch {
    return {}
  }
}

export const AnalysisWorkspace: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [saved, setSaved] = useState<SavedLayouts>(readLayouts)
  const [collapsed, setCollapsed] = useState(false)
  const [layoutError, setLayoutError] = useState(false)
  const [overlapBlocked, setOverlapBlocked] = useState(false)
  const bounds = useMemo(() => workspaceBounds(width || 1), [width])
  const mode = width >= WIDE_WORKSPACE ? "wide" : "narrow"

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const measure = () => {
      const next = element.getBoundingClientRect().width
      if (next > 0) setWidth(next)
    }
    measure()
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener("resize", measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const layouts = useMemo(
    () =>
      arrangePanels(
        {
          taggingPanel:
            saved[mode]?.taggingPanel ||
            defaultPanelLayout("taggingPanel", bounds),
          timelinePanel:
            saved[mode]?.timelinePanel ||
            defaultPanelLayout("timelinePanel", bounds)
        },
        bounds
      ) || {
        taggingPanel: defaultPanelLayout("taggingPanel", bounds),
        timelinePanel: defaultPanelLayout("timelinePanel", bounds)
      },
    [saved, mode, bounds]
  )

  const persist = useCallback((next: SavedLayouts) => {
    setSaved(next)
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(next))
      setLayoutError(false)
    } catch {
      setLayoutError(true)
    }
  }, [])
  const update = useCallback(
    (id: PanelId, change: Partial<PanelLayout>) => {
      const arranged = arrangePanels(
        { ...layouts, [id]: { ...layouts[id], ...change } },
        bounds,
        id
      )
      setOverlapBlocked(!arranged)
      if (!arranged) return
      const latest = layoutError ? saved : readLayouts()
      persist({
        ...latest,
        [mode]: arranged
      })
    },
    [mode, layouts, bounds, persist, saved, layoutError]
  )
  const value = useMemo(
    () => ({ bounds, layouts, update }),
    [bounds, layouts, update]
  )

  return (
    <section
      aria-label="YouCoder 作業領域"
      className="my-4 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
      style={{ isolation: "isolate", overflow: "hidden" }}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 text-sm">
        <strong className="mr-auto">YouCoder</strong>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => {
            const next = { ...(layoutError ? saved : readLayouts()) }
            delete next[mode]
            persist(next)
            setOverlapBlocked(false)
          }}>
          配置をリセット
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? "パネルを開く" : "パネルを折りたたむ"}
        </button>
      </div>
      {layoutError && (
        <p role="status" className="px-3 py-2 text-sm text-red-700">
          パネル配置を保存できませんでした。このページ内でのみ反映されます。
        </p>
      )}
      {overlapBlocked && (
        <p role="status" className="px-3 py-2 text-sm text-slate-700">
          パネルが重ならない空きがないため、直前の配置を保ちました。
        </p>
      )}
      <WorkspaceContext.Provider value={value}>
        <div
          ref={canvasRef}
          data-youcoder-workspace=""
          style={{
            position: "relative",
            width: "100%",
            height: collapsed ? 0 : bounds.height,
            overflow: "hidden",
            visibility: collapsed ? "hidden" : "visible"
          }}>
          {children}
        </div>
      </WorkspaceContext.Provider>
    </section>
  )
}

export const useWorkspacePanel = (id: PanelId) => {
  const workspace = useContext(WorkspaceContext)
  const bounds =
    workspace?.bounds ||
    workspaceBounds(typeof window === "undefined" ? 800 : window.innerWidth)
  const layout = workspace?.layouts[id] || defaultPanelLayout(id, bounds)
  return {
    ...layout,
    bounds,
    handlePositionChange: (position: Position) =>
      workspace?.update(id, { position }),
    handleSizeChange: (size: Size) => workspace?.update(id, { size })
  }
}
