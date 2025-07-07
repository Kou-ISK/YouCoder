import React, { useCallback, useMemo, useRef } from "react"

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
      console.log(`[YouCoder] 動画を${timeInSeconds}秒の位置に移動しました`)
    } else {
      console.warn("[YouCoder] 動画要素が見つかりませんでした")
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
    console.log(
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
    console.log(
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
        style={{
          padding: "6px 8px",
          textAlign: "left",
          fontWeight: "600",
          color: "#1e293b",
          borderBottom: "none",
          fontSize: "11px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
          width,
          transition: "background-color 0.2s ease",
          backgroundColor: isSorted
            ? "#f1f5f9"
            : hoveredHeaders[index]
              ? "#f8fafc"
              : "transparent"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {title}
          <span
            style={{
              color: isSorted
                ? "#6b7280"
                : hoveredHeaders[index]
                  ? "#94a3b8"
                  : "#cbd5e1",
              fontSize: "10px",
              transition: "color 0.2s ease"
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
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        position: "relative"
      }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderSpacing: 0,
          tableLayout: "fixed",
          fontSize: "12px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minWidth: "600px" // 最小幅を設定してスクロールを可能にする
        }}>
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "50%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#f1f5f9",
            zIndex: 10,
            borderBottom: "1px solid #cbd5e1"
          }}>
          <tr>
            {renderSortHeader("チーム", "team", "15%", 0)}
            {renderSortHeader("アクション", "action", "20%", 1)}
            {renderSortHeader("開始時間", "start", "12%", 2)}
            {renderSortHeader("終了時間", "end", "12%", 3)}
            <th
              style={{
                padding: "6px 8px",
                textAlign: "left",
                fontWeight: "600",
                color: "#1e293b",
                borderBottom: "none",
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "36%"
              }}>
              ラベル
            </th>
            <th
              style={{
                padding: "6px 8px",
                textAlign: "center",
                fontWeight: "600",
                color: "#1e293b",
                borderBottom: "none",
                fontSize: "11px",
                width: "5%"
              }}>
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
              <td
                style={{
                  padding: "6px 8px",
                  color: "#374151",
                  fontWeight: "400",
                  borderBottom: "1px solid #e5e7eb",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                {action.team}
              </td>
              <td
                style={{
                  padding: "6px 8px",
                  color: "#111827",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                {action.action}
              </td>
              <td
                onClick={() => seekToTime(action.start)}
                style={{
                  padding: "6px 8px",
                  color: "#3b82f6",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                  cursor: "pointer",
                  textDecoration: "underline dotted"
                }}
                title="クリックすると動画の該当位置にジャンプします">
                {formatTime(action.start)}
              </td>
              <td
                onClick={action.end ? () => seekToTime(action.end) : undefined}
                style={{
                  padding: "6px 8px",
                  color: action.end ? "#3b82f6" : "#f59e0b",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                  cursor: action.end ? "pointer" : "default",
                  textDecoration: action.end ? "underline dotted" : "none"
                }}
                title={
                  action.end
                    ? "クリックすると動画の該当位置にジャンプします"
                    : "進行中のアクション"
                }>
                {action.end ? formatTime(action.end) : "進行中"}
              </td>
              <td
                style={{
                  padding: "6px 8px",
                  color: "#6b7280",
                  fontSize: "11px",
                  borderBottom: "1px solid #e5e7eb",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                {action.labels && action.labels.length > 0
                  ? action.labels.map((label, index) => {
                      const isCategorizeDLabel = label.includes(" - ")
                      return (
                        <span key={index}>
                          {isCategorizeDLabel ? (
                            <span style={{ fontSize: "11px" }}>
                              <span
                                style={{ color: "#9ca3af", fontWeight: "500" }}>
                                [{label.split(" - ")[0]}]
                              </span>
                              <span style={{ color: "#6b7280" }}>
                                {" " + label.split(" - ").slice(1).join(" - ")}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: "#374151" }}>{label}</span>
                          )}
                          {index < action.labels.length - 1 && (
                            <span style={{ color: "#d1d5db" }}>, </span>
                          )}
                        </span>
                      )
                    })
                  : "-"}
              </td>
              <td
                style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  borderBottom: "1px solid #e5e7eb",
                  position: "relative"
                }}>
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
                        fontSize: "10px",
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
                        fontSize: "10px",
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
                      fontSize: "10px",
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
                      fontSize: "10px",
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
