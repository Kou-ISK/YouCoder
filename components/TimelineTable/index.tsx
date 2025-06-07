import React, { useEffect, useRef } from "react"

import type { TimelineTableProps } from "./types"

const TimelineTable: React.FC<TimelineTableProps> = ({
  actions,
  onDelete,
  onSeek
}) => {
  // テーブルボディのrefを作成して、自動スクロール用に使用します
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  // アクションが追加された時に一番下にスクロールします
  useEffect(() => {
    if (tbodyRef.current && actions.length > 0) {
      const lastRow = tbodyRef.current.lastElementChild
      if (lastRow && typeof lastRow.scrollIntoView === "function") {
        lastRow.scrollIntoView({ behavior: "smooth", block: "end" })
      }
    }
  }, [actions.length])

  // YouTube動画の再生位置を変更する関数
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

  const formatTime = (timestamp: number) => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = timestamp % 1000

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}.${String(milliseconds).padStart(3, "0")}`
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        borderSpacing: 0,
        fontSize: "12px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
      <thead
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#f1f5f9",
          zIndex: 1,
          borderBottom: "1px solid #cbd5e1"
        }}>
        <tr>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            チーム
          </th>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            アクション
          </th>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            開始時間
          </th>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            終了時間
          </th>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "left",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            ラベル
          </th>
          <th
            style={{
              padding: "10px 12px",
              textAlign: "center",
              fontWeight: "600",
              color: "#1e293b",
              borderBottom: "none",
              fontSize: "12px"
            }}>
            操作
          </th>
        </tr>
      </thead>
      <tbody ref={tbodyRef}>
        {actions.map((action, index) => (
          <tr
            key={index}
            style={{
              backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
              borderBottom: "1px solid #e5e7eb"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f9ff"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                index % 2 === 0 ? "#ffffff" : "#f9fafb"
            }}>
            <td
              style={{
                padding: "8px 12px",
                color: "#374151",
                fontWeight: "400",
                borderBottom: "1px solid #e5e7eb"
              }}>
              {action.team}
            </td>
            <td
              style={{
                padding: "8px 12px",
                color: "#111827",
                fontWeight: "500",
                borderBottom: "1px solid #e5e7eb"
              }}>
              {action.action}
            </td>
            <td
              onClick={() => seekToTime(action.start)}
              style={{
                padding: "8px 12px",
                color: "#3b82f6",
                fontFamily: "monospace",
                fontSize: "12px",
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
                padding: "8px 12px",
                color: action.end ? "#3b82f6" : "#f59e0b",
                fontFamily: "monospace",
                fontSize: "12px",
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
                padding: "8px 12px",
                color: "#6b7280",
                fontSize: "12px",
                borderBottom: "1px solid #e5e7eb"
              }}>
              {action.labels && action.labels.length > 0
                ? action.labels.map((label: string, index: number) => {
                    // カテゴリ付きラベルかどうかをチェック
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
                padding: "8px 12px",
                textAlign: "center",
                borderBottom: "1px solid #e5e7eb"
              }}>
              <button
                onClick={() => {
                  onDelete(action.team, action.action, action.start)
                }}
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}>
                削除
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { TimelineTable }
export default TimelineTable
