import React, { useEffect, useRef, useState } from "react"

import { DraggableResizable } from "../DraggableResizable"
import { TimelineActions } from "../TimelineActions"
import { TimelineTable } from "../TimelineTable"
import type {
  Action,
  FilterConfig,
  SortConfig,
  TimelinePanelProps
} from "./types"

const MIN_WIDTH = 300
const MIN_HEIGHT = 180

// 動的に画面サイズを取得する関数 - 画面下部に完全密着
const getInitialPosition = () => ({
  x: 0,
  y: (typeof window !== "undefined" ? window.innerHeight : 800) - 180
})

const getInitialSize = () => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1200,
  height: 180
})

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave,
  onExportCSV,
  onSeek,
  defaultSort,
  defaultFilter
}) => {
  console.log(
    `[TimelinePanel] レンダリング開始 - 受信アクション数: ${actions.length}`
  )

  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSort
  )
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(
    defaultFilter || {}
  )
  const [panelPosition, setPanelPosition] = useState(() => getInitialPosition())
  const [panelSize, setPanelSize] = useState(() => getInitialSize())
  const tableRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevActionsRef = useRef<Action[]>([])
  const userScrolledRef = useRef<boolean>(false)
  const lastScrollTimeRef = useRef<number>(0)
  const [newActionIndicator, setNewActionIndicator] = useState<boolean>(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false)

  // ウィンドウリサイズ時にパネル位置とサイズを調整
  useEffect(() => {
    const handleWindowResize = () => {
      const newSize = getInitialSize()
      const newPosition = getInitialPosition()
      setPanelSize(newSize)
      setPanelPosition(newPosition)
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [])

  // ユーザーのスクロール操作を検知
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleUserScroll = () => {
      userScrolledRef.current = true
      lastScrollTimeRef.current = Date.now()

      // スクロール位置に基づいて「下部に移動」ボタンの表示を制御
      const isNearBottom =
        scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight <
        100
      setShowScrollToBottom(!isNearBottom)

      // 3秒後にユーザースクロール状態をリセット
      setTimeout(() => {
        if (Date.now() - lastScrollTimeRef.current >= 3000) {
          userScrolledRef.current = false
        }
      }, 3000)
    }

    scrollContainer.addEventListener("scroll", handleUserScroll, {
      passive: true
    })

    return () => {
      scrollContainer.removeEventListener("scroll", handleUserScroll)
    }
  }, [])

  // タイムラインの自動スクロール - 新しいアクションが追加された時は常に最下部へ
  useEffect(() => {
    const isNewActionAdded = actions.length > prevActionsRef.current.length

    if (isNewActionAdded) {
      console.log(
        `[TimelinePanel] 新しいアクション追加を検知 - 最下部にスクロールします (${prevActionsRef.current.length} → ${actions.length})`
      )

      // 最初にscrollContainerRefを試す（TimelineTableの直接のスクロールコンテナ）
      const scrollContainer = scrollContainerRef.current

      if (scrollContainer) {
        // ユーザーが最近スクロールした場合は、下部近くにいる時のみ自動スクロール
        const isNearBottom =
          scrollContainer.scrollHeight -
            scrollContainer.scrollTop -
            scrollContainer.clientHeight <
          100
        const shouldAutoScroll = !userScrolledRef.current || isNearBottom

        if (shouldAutoScroll) {
          console.log(
            `[TimelinePanel] 自動スクロール実行: userScrolled=${userScrolledRef.current}, isNearBottom=${isNearBottom}`
          )

          // アニメーションフレームを使用して、DOMの更新後に確実にスクロール
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (scrollContainer) {
                const beforeScrollTop = scrollContainer.scrollTop
                // JSdom環境での互換性を考慮
                if (typeof scrollContainer.scrollTo === "function") {
                  scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth"
                  })
                } else {
                  // フォールバック: scrollTopを直接設定
                  scrollContainer.scrollTop = scrollContainer.scrollHeight
                }
                console.log(
                  `[TimelinePanel] scrollContainerでスクロール実行 - beforeTop: ${beforeScrollTop}, targetTop: ${scrollContainer.scrollHeight}`
                )
              }
            }, 100)
          })
        } else {
          console.log(
            `[TimelinePanel] 自動スクロールをスキップ: ユーザーがスクロール中またはトップ付近にいます`
          )
        }
      } else if (tableRef.current) {
        // フォールバック1: tableRef内のスクロール可能要素を検索
        console.log(
          "[TimelinePanel] scrollContainerRefが利用できないため、tableRef内を検索"
        )
        const scrollableDiv = tableRef.current.querySelector(
          'div[style*="overflow: auto"], div[style*="overflow:auto"]'
        ) as HTMLElement

        if (scrollableDiv) {
          const isNearBottom =
            scrollableDiv.scrollHeight -
              scrollableDiv.scrollTop -
              scrollableDiv.clientHeight <
            100
          const shouldAutoScroll = !userScrolledRef.current || isNearBottom

          if (shouldAutoScroll) {
            console.log(
              `[TimelinePanel] tableRef内のスクロール可能要素で自動スクロール: scrollHeight=${scrollableDiv.scrollHeight}`
            )

            requestAnimationFrame(() => {
              setTimeout(() => {
                if (scrollableDiv) {
                  const beforeScrollTop = scrollableDiv.scrollTop
                  // JSdom環境での互換性を考慮
                  if (typeof scrollableDiv.scrollTo === "function") {
                    scrollableDiv.scrollTo({
                      top: scrollableDiv.scrollHeight,
                      behavior: "smooth"
                    })
                  } else {
                    // フォールバック: scrollTopを直接設定
                    scrollableDiv.scrollTop = scrollableDiv.scrollHeight
                  }
                  console.log(
                    `[TimelinePanel] tableRef内スクロール実行 - beforeTop: ${beforeScrollTop}, targetTop: ${scrollableDiv.scrollHeight}`
                  )
                }
              }, 100)
            })
          }
        } else {
          // フォールバック2: tableRef.current自体がスクロール可能な場合
          console.log(
            "[TimelinePanel] 専用のスクロール要素が見つからないため、tableRefをチェック"
          )
          const computedStyle = window.getComputedStyle(tableRef.current)

          if (
            computedStyle.overflow === "auto" ||
            computedStyle.overflowY === "auto" ||
            computedStyle.overflow === "scroll" ||
            computedStyle.overflowY === "scroll"
          ) {
            const isNearBottom =
              tableRef.current.scrollHeight -
                tableRef.current.scrollTop -
                tableRef.current.clientHeight <
              100
            const shouldAutoScroll = !userScrolledRef.current || isNearBottom

            if (shouldAutoScroll) {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  if (tableRef.current) {
                    const beforeScrollTop = tableRef.current.scrollTop
                    // JSdom環境での互換性を考慮
                    if (typeof tableRef.current.scrollTo === "function") {
                      tableRef.current.scrollTo({
                        top: tableRef.current.scrollHeight,
                        behavior: "smooth"
                      })
                    } else {
                      // フォールバック: scrollTopを直接設定
                      tableRef.current.scrollTop = tableRef.current.scrollHeight
                    }
                    console.log(
                      `[TimelinePanel] tableRefでスクロール実行 - beforeTop: ${beforeScrollTop}, targetTop: ${tableRef.current.scrollHeight}`
                    )
                  }
                }, 100)
              })
            }
          } else {
            console.warn(
              "[TimelinePanel] スクロール可能な要素が見つかりませんでした"
            )
          }
        }
      } else {
        console.warn("[TimelinePanel] tableRefが利用できません")
      }
    }

    prevActionsRef.current = [...actions]
  }, [actions])

  // 新しいアクションインジケーターの管理
  useEffect(() => {
    const isNewActionAdded = actions.length > prevActionsRef.current.length

    if (isNewActionAdded) {
      setNewActionIndicator(true)

      // 2秒後にインジケーターを非表示
      const timer = setTimeout(() => {
        setNewActionIndicator(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [actions])

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

  // プルダウンフィルターの処理
  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilterConfig((prev) => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  // フィルターリセット
  const handleFilterReset = () => {
    setFilterConfig({})
  }

  // 動的な選択肢の生成
  const getUniqueTeams = () => {
    const teams = [...new Set(actions.map((action) => action.team))]
    return teams.sort()
  }

  const getUniqueActions = () => {
    const actionTypes = [...new Set(actions.map((action) => action.action))]
    return actionTypes.sort()
  }

  const getUniqueLabels = () => {
    const labels = [
      ...new Set(actions.flatMap((action) => action.labels || []))
    ]
    return labels.sort()
  }

  // 手動で下部にスクロールする関数
  const scrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      // JSdom環境での互換性を考慮
      if (typeof scrollContainer.scrollTo === "function") {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        })
      } else {
        // フォールバック: scrollTopを直接設定
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
      setShowScrollToBottom(false)
      userScrolledRef.current = false
    }
  }

  return (
    <DraggableResizable
      initialPosition={panelPosition}
      initialSize={panelSize}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      className="rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 transition-all duration-300 ease-in-out hover:shadow-2xl"
      style={{
        zIndex: 10000,
        borderRadius: "8px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column"
      }}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
        <div
          className="timeline-actions flex items-center justify-between border-b border-gray-100/60 bg-gradient-to-r from-white/80 via-white/60 to-gray-50/40 backdrop-blur-sm cursor-grab"
          style={{
            padding: "5px 5px",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            flexShrink: 0,
            minHeight: "30px",
            position: "relative"
          }}>
          <TimelineActions
            onExportCSV={onExportCSV}
            onSave={onSave}
            filterConfig={filterConfig}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            getUniqueTeams={getUniqueTeams}
            getUniqueActions={getUniqueActions}
            getUniqueLabels={getUniqueLabels}
          />

          {/* 新しいアクションのインジケーター */}
          {newActionIndicator && (
            <div
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "#10b981",
                color: "white",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "500",
                animation: "pulse 1s infinite",
                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)"
              }}>
              新しいアクション追加
            </div>
          )}
        </div>
        <div
          ref={tableRef}
          className="timeline-content bg-white/95 cursor-default"
          style={{
            flex: 1,
            overflow: "hidden",
            padding: "8px",
            minHeight: 0, // フレックスアイテムが縮小可能にする
            position: "relative"
          }}>
          <TimelineTable
            actions={actions}
            onDelete={onDelete}
            onSeek={onSeek}
            sortConfig={sortConfig}
            onSort={handleSort}
            filterConfig={filterConfig}
            scrollContainerRef={scrollContainerRef}
          />

          {/* 下部に移動ボタン */}
          {showScrollToBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                zIndex: 1000,
                transition: "all 0.2s ease",
                animation: "fadeIn 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb"
                e.currentTarget.style.transform = "scale(1.1)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6"
                e.currentTarget.style.transform = "scale(1)"
              }}
              title="最新のアクションに移動">
              ↓
            </button>
          )}
        </div>
      </div>
    </DraggableResizable>
  )
}
