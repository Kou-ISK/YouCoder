import React, { useCallback, useMemo, useRef } from "react"

import { STYLES, TABLE } from "../../constants"
import { logger } from "../../utils/errorHandling"
import type { TimelineTableProps } from "./types"

const TimelineTable: React.FC<TimelineTableProps> = ({
  actions,
  onDelete,
  onSeek,
  onSort,
  sortConfig,
  filterConfig,
  scrollContainerRef
}) => {
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  // ホバー状態を管理する配列（team, action, start, end の順）
  const [hoveredHeaders, setHoveredHeaders] = React.useState<boolean[]>([
    false,
    false,
    false,
    false
  ])
  // 行のホバー状態を管理
  const [hoveredRowIndex, setHoveredRowIndex] = React.useState<number | null>(
    null
  )
  // 削除確認状態を管理
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState<
    number | null
  >(null)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ミリ秒を "MM:SS.mmm" 形式にフォーマット
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = ms % 1000

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}.${String(milliseconds).padStart(3, "0")}`
  }

  // シーク機能
  const seekToTime = (timeInMs: number) => {
    // onSeek propが提供されている場合はそちらを使用
    if (onSeek) {
      onSeek(timeInMs)
      return
    }

    // フォールバック: 直接動画要素を操作
    const video = document.querySelector("video") as HTMLVideoElement
    if (video) {
      // ミリ秒を秒に変換
      const timeInSeconds = timeInMs / 1000
      video.currentTime = timeInSeconds
      logger.info(`[YouCoder] 動画を${timeInSeconds}秒の位置に移動しました`)
    } else {
      logger.warn("[YouCoder] 動画要素が見つかりませんでした")
    }
  }

  // マウスイベントハンドラー
  const handleRowMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, index: number) => {
      if (pendingDeleteIndex !== index) {
        e.currentTarget.style.backgroundColor = "#f0f9ff"
      }
      setHoveredRowIndex(index)
    },
    [pendingDeleteIndex]
  )

  const handleRowMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, index: number) => {
      if (pendingDeleteIndex === index) {
        e.currentTarget.style.backgroundColor = "#fef2f2"
      } else {
        e.currentTarget.style.backgroundColor =
          index % 2 === 0 ? "#ffffff" : "#f9fafb"
      }
      setHoveredRowIndex(null)
    },
    [pendingDeleteIndex]
  )

  // 削除確認のタイムアウトコールバック
  const resetDeleteConfirmation = useCallback(() => {
    setPendingDeleteIndex(null)
    deleteTimeoutRef.current = null
  }, [])

  // 二段階削除確認機能
  const handleDeleteClick = useCallback(
    (team: string, action: string, start: number, index: number) => {
      if (pendingDeleteIndex === index) {
        // 二回目のクリック - 実際に削除を実行
        onDelete(team, action, start)
        resetDeleteConfirmation()
        if (deleteTimeoutRef.current) {
          clearTimeout(deleteTimeoutRef.current)
        }
      } else {
        // 最初のクリック - 確認状態に入る
        setPendingDeleteIndex(index)

        // 3秒後に確認状態をリセット
        if (deleteTimeoutRef.current) {
          clearTimeout(deleteTimeoutRef.current)
        }
        deleteTimeoutRef.current = setTimeout(resetDeleteConfirmation, 3000)
      }
    },
    [pendingDeleteIndex, onDelete, resetDeleteConfirmation]
  )

  // ESCキーで削除確認をキャンセル
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pendingDeleteIndex !== null) {
        resetDeleteConfirmation()
        if (deleteTimeoutRef.current) {
          clearTimeout(deleteTimeoutRef.current)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [pendingDeleteIndex, resetDeleteConfirmation])

  // コンポーネントのクリーンアップ
  React.useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
      }
    }
  }, [])

  // ソートとフィルターを適用した最終的なアクションリスト
  const processedActions = useMemo(() => {
    logger.debug(
      `[TimelineTable] processedActions計算開始 - 入力アクション数: ${actions.length}`
    )
    let result = [...actions]
    if (filterConfig) {
      result = result.filter((action) => {
        if (filterConfig.team && action.team !== filterConfig.team) {
          return false
        }
        if (filterConfig.action && action.action !== filterConfig.action) {
          return false
        }
        if (
          filterConfig.label &&
          !action.labels?.some((label) => label === filterConfig.label)
        ) {
          return false
        }
        if (filterConfig.timeRange) {
          const { start, end } = filterConfig.timeRange
          if (action.start < start || (action.end && action.end > end)) {
            return false
          }
        }
        return true
      })
    }
    if (sortConfig) {
      result.sort((a, b) => {
        if (
          a[sortConfig.key] === undefined ||
          b[sortConfig.key] === undefined
        ) {
          return 0
        }
        const comparison = (() => {
          if (typeof a[sortConfig.key] === "number") {
            return a[sortConfig.key] - b[sortConfig.key]
          }
          return String(a[sortConfig.key]).localeCompare(
            String(b[sortConfig.key])
          )
        })()
        return sortConfig.direction === "asc" ? comparison : -comparison
      })
    }
    logger.debug(
      `[TimelineTable] processedActions計算完了 - 出力アクション数: ${result.length}`
    )
    return result
  }, [actions, sortConfig, filterConfig])

  // ソートヘッダーをレンダリングする関数
  const renderSortHeader = (
    title: string,
    key: "team" | "action" | "start" | "end",
    width: string,
    index: number
  ) => {
    const isSorted = sortConfig?.key === key
    const isAsc = isSorted && sortConfig.direction === "asc"

    return (
      <th
        onClick={() => onSort && onSort(key)}
        onMouseEnter={() => {
          const newHoveredHeaders = [...hoveredHeaders]
          newHoveredHeaders[index] = true
          setHoveredHeaders(newHoveredHeaders)
        }}
        onMouseLeave={() => {
          const newHoveredHeaders = [...hoveredHeaders]
          newHoveredHeaders[index] = false
          setHoveredHeaders(newHoveredHeaders)
        }}
        className="px-2 py-1.5 text-left font-semibold text-slate-800 text-base overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer transition-colors duration-200"
        style={{
          width,
          backgroundColor: isSorted
            ? "#f1f5f9"
            : hoveredHeaders[index]
              ? "#f8fafc"
              : "transparent"
        }}>
        <div className="flex items-center gap-1">
          {title}
          <span
            className="text-sm transition-colors duration-200"
            style={{
              color: isSorted
                ? "#6b7280"
                : hoveredHeaders[index]
                  ? "#94a3b8"
                  : "#cbd5e1"
            }}>
            {isAsc ? "▲" : "▼"}
          </span>
        </div>
      </th>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full overflow-auto relative">
      <table
        className="w-full border-collapse table-fixed text-base font-sans"
        style={{ minWidth: TABLE.MIN_WIDTH }}>
        <colgroup>
          <col style={{ width: TABLE.COLUMN_WIDTHS.TEAM }} />
          <col style={{ width: TABLE.COLUMN_WIDTHS.ACTION }} />
          <col style={{ width: TABLE.COLUMN_WIDTHS.START_TIME }} />
          <col style={{ width: TABLE.COLUMN_WIDTHS.END_TIME }} />
          <col style={{ width: TABLE.COLUMN_WIDTHS.LABELS }} />
          <col style={{ width: TABLE.COLUMN_WIDTHS.MENU }} />
        </colgroup>
        <thead
          className="sticky top-0 bg-slate-100 border-b border-slate-300"
          style={{ zIndex: STYLES.Z_INDEX.TABLE_HEADER }}>
          <tr>
            {renderSortHeader("チーム", "team", "15%", 0)}
            {renderSortHeader("アクション", "action", "20%", 1)}
            {renderSortHeader("開始時間", "start", "12%", 2)}
            {renderSortHeader("終了時間", "end", "12%", 3)}
            <th className="px-2 py-1.5 text-left font-semibold text-slate-800 text-base overflow-hidden text-ellipsis whitespace-nowrap w-9/25">
              ラベル
            </th>
            <th className="px-2 py-1.5 text-center font-semibold text-slate-800 text-base w-1/20">
              操作
            </th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {processedActions.map((action, index) => (
            <tr
              key={index}
              style={{
                backgroundColor:
                  pendingDeleteIndex === index
                    ? "#fef2f2"
                    : index % 2 === 0
                      ? "#ffffff"
                      : "#f9fafb",
                borderLeft:
                  pendingDeleteIndex === index
                    ? "3px solid #ef4444"
                    : "3px solid transparent",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => handleRowMouseEnter(e, index)}
              onMouseLeave={(e) => handleRowMouseLeave(e, index)}>
              <td className="px-2 py-1.5 text-gray-700 font-normal border-b border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                {action.team}
              </td>
              <td className="px-2 py-1.5 text-gray-900 font-medium border-b border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                {action.action}
              </td>
              <td
                onClick={() => seekToTime(action.start)}
                className="px-2 py-1.5 text-blue-500 font-mono text-base font-medium border-b border-gray-200 cursor-pointer underline decoration-dotted"
                title="クリックすると動画の該当位置にジャンプします">
                {formatTime(action.start)}
              </td>
              <td
                onClick={action.end ? () => seekToTime(action.end) : undefined}
                className={`px-2 py-1.5 font-mono text-base font-medium border-b border-gray-200 ${
                  action.end
                    ? "text-blue-500 cursor-pointer underline decoration-dotted"
                    : "text-amber-500 cursor-default"
                }`}
                title={
                  action.end
                    ? "クリックすると動画の該当位置にジャンプします"
                    : "進行中のアクション"
                }>
                {action.end ? formatTime(action.end) : "進行中"}
              </td>
              <td className="px-2 py-1.5 text-gray-500 text-base border-b border-gray-200 overflow-hidden text-ellipsis whitespace-nowrap">
                {action.labels && action.labels.length > 0
                  ? action.labels.map((label, index) => {
                      const hasCategory = label.includes(" - ")
                      return (
                        <span key={index}>
                          {hasCategory ? (
                            <span className="text-base">
                              <span className="text-gray-400 font-medium">
                                [{label.split(" - ")[0]}]
                              </span>
                              <span className="text-gray-500">
                                {" " + label.split(" - ").slice(1).join(" - ")}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-700">{label}</span>
                          )}
                          {index < action.labels.length - 1 && (
                            <span className="text-gray-300">, </span>
                          )}
                        </span>
                      )
                    })
                  : "-"}
              </td>
              <td className="px-2 py-1.5 text-center border-b border-gray-200 relative">
                {hoveredRowIndex === index ? (
                  pendingDeleteIndex === index ? (
                    // 削除確認状態のボタン
                    <button
                      onClick={() =>
                        handleDeleteClick(
                          action.team,
                          action.action,
                          action.start,
                          index
                        )
                      }
                      style={{
                        backgroundColor: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: "600",
                        animation: "pulse 1s infinite"
                      }}
                      title="もう一度クリックすると削除されます">
                      削除確認
                    </button>
                  ) : (
                    // 通常の削除ボタン
                    <button
                      onClick={() =>
                        handleDeleteClick(
                          action.team,
                          action.action,
                          action.start,
                          index
                        )
                      }
                      style={{
                        backgroundColor: "transparent",
                        color: "#6b7280",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fee2e2"
                        e.currentTarget.style.color = "#b91c1c"
                        e.currentTarget.style.borderColor = "#fecaca"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "#6b7280"
                        e.currentTarget.style.borderColor = "#d1d5db"
                      }}
                      title="クリックして削除を開始">
                      🗑️
                    </button>
                  )
                ) : pendingDeleteIndex === index ? (
                  // ホバーしていないが削除確認状態のアイテム
                  <button
                    onClick={() =>
                      handleDeleteClick(
                        action.team,
                        action.action,
                        action.start,
                        index
                      )
                    }
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontWeight: "600",
                      animation: "pulse 1s infinite"
                    }}
                    title="もう一度クリックすると削除されます">
                    削除確認
                  </button>
                ) : (
                  // 何も表示しない（削除ボタンを隠す）
                  <span
                    style={{
                      color: "#e5e7eb",
                      fontSize: "14px",
                      fontWeight: "400",
                      userSelect: "none"
                    }}>
                    ⋯
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { TimelineTable }
export default TimelineTable
