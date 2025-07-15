import { useEffect, useRef, useState } from "react"

import type { Action, FilterConfig, SortConfig } from "../types"

interface UseTimelinePanelProps {
  actions: Action[]
  defaultSort?: SortConfig
  defaultFilter?: FilterConfig
}

interface UseTimelinePanelReturn {
  sortConfig: SortConfig | undefined
  filterConfig: FilterConfig
  showScrollToBottom: boolean
  newActionIndicator: boolean
  tableRef: React.RefObject<HTMLDivElement>
  scrollContainerRef: React.RefObject<HTMLDivElement>
  userScrolledRef: React.MutableRefObject<boolean>
  handleSort: (key: SortConfig["key"]) => void
  handleFilterChange: (key: keyof FilterConfig, value: string) => void
  handleFilterReset: () => void
  getUniqueTeams: () => string[]
  getUniqueActions: () => string[]
  getUniqueLabels: () => string[]
  scrollToBottom: () => void
}

/**
 * TimelinePanelの状態管理とビジネスロジックを担当するカスタムフック
 */
export const useTimelinePanel = ({
  actions,
  defaultSort,
  defaultFilter
}: UseTimelinePanelProps): UseTimelinePanelReturn => {
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSort
  )
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(
    defaultFilter || {}
  )
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [newActionIndicator, setNewActionIndicator] = useState(false)

  const tableRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef<boolean>(false)
  const prevActionsRef = useRef<Action[]>([])

  // ソート処理
  const handleSort = (key: SortConfig["key"]) => {
    setSortConfig((prevSort) => {
      if (prevSort?.key === key) {
        return { key, direction: prevSort.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  // フィルター処理
  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    setFilterConfig((prev) => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handleFilterReset = () => {
    setFilterConfig({})
  }

  // ユニークな値の取得
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

  // スクロール処理
  const scrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      if (typeof scrollContainer.scrollTo === "function") {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        })
      } else {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
      setShowScrollToBottom(false)
      userScrolledRef.current = false
    }
  }

  // 新しいアクション追加時のインジケーター表示
  useEffect(() => {
    const isNewActionAdded = actions.length > prevActionsRef.current.length
    if (isNewActionAdded) {
      setNewActionIndicator(true)
      const timer = setTimeout(() => {
        setNewActionIndicator(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [actions.length])

  // タイムラインの自動スクロール
  useEffect(() => {
    const isNewActionAdded = actions.length > prevActionsRef.current.length

    if (isNewActionAdded) {
      console.log(
        `[TimelinePanel] 新しいアクション追加を検知 - 最下部にスクロールします (${prevActionsRef.current.length} → ${actions.length})`
      )

      const scrollContainer = scrollContainerRef.current

      if (scrollContainer) {
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

          requestAnimationFrame(() => {
            setTimeout(() => {
              if (scrollContainer) {
                const beforeScrollTop = scrollContainer.scrollTop
                if (typeof scrollContainer.scrollTo === "function") {
                  scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth"
                  })
                } else {
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
            `[TimelinePanel] 自動スクロールをスキップ - ユーザーが手動でスクロール中またはBottom近くにいません`
          )
        }
      } else if (tableRef.current) {
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
                  if (typeof tableRef.current.scrollTo === "function") {
                    tableRef.current.scrollTo({
                      top: tableRef.current.scrollHeight,
                      behavior: "smooth"
                    })
                  } else {
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
      } else {
        console.warn("[TimelinePanel] tableRefが利用できません")
      }
    }

    prevActionsRef.current = [...actions]
  }, [actions])

  // スクロール位置の監視
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      // ユーザーが手動でスクロールしたかどうかを記録
      userScrolledRef.current = true

      // 下部近くでない場合は「最下部に移動」ボタンを表示
      setShowScrollToBottom(!isNearBottom)

      // しばらく操作がない場合はユーザースクロールフラグをリセット
      const resetUserScrolled = setTimeout(() => {
        if (isNearBottom) {
          userScrolledRef.current = false
        }
      }, 2000)

      return () => clearTimeout(resetUserScrolled)
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [])

  return {
    sortConfig,
    filterConfig,
    showScrollToBottom,
    newActionIndicator,
    tableRef,
    scrollContainerRef,
    userScrolledRef,
    handleSort,
    handleFilterChange,
    handleFilterReset,
    getUniqueTeams,
    getUniqueActions,
    getUniqueLabels,
    scrollToBottom
  }
}
