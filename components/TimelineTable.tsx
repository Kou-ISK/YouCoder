import React, { useEffect, useRef } from "react"

import { deleteAction } from "../lib/actionsManager"

interface TimelineTableProps {
  actions: any[]
  onDelete: (team: string, action: string, start: number) => void
}

const TimelineTable: React.FC<TimelineTableProps> = ({ actions, onDelete }) => {
  // テーブルボディのrefを作成して、自動スクロール用に使用します
  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  // アクションが追加された時に一番下にスクロールします
  useEffect(() => {
    if (tbodyRef.current && actions.length > 0) {
      const lastRow = tbodyRef.current.lastElementChild
      if (lastRow) {
        lastRow.scrollIntoView({ behavior: "smooth", block: "end" })
      }
    }
  }, [actions.length])

  const formatTime = (timestamp: number) => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = timestamp % 1000

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px"
      }}>
      <thead
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 1
        }}>
        <tr>
          <th style={{ padding: "8px", textAlign: "left" }}>チーム</th>
          <th style={{ padding: "8px", textAlign: "left" }}>アクション</th>
          <th style={{ padding: "8px", textAlign: "left" }}>開始時間</th>
          <th style={{ padding: "8px", textAlign: "left" }}>終了時間</th>
          <th style={{ padding: "8px", textAlign: "left" }}>ラベル</th>
          <th style={{ padding: "8px", textAlign: "left" }}></th>
        </tr>
      </thead>
      <tbody ref={tbodyRef}>
        {actions.map((action, index) => (
          <tr
            key={index}
            style={{
              borderBottom: "1px solid #eee",
              backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white"
            }}>
            <td style={{ padding: "8px" }}>{action.team}</td>
            <td style={{ padding: "8px" }}>{action.action}</td>
            <td
              style={{
                padding: "8px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
              onClick={() => {
                const video = document.querySelector("video")
                if (video) {
                  const wasPaused = video.paused
                  video.currentTime = action.start / 1000
                  if (!wasPaused) {
                    video.play()
                  }
                }
              }}>
              {formatTime(action.start)}
            </td>
            <td
              style={{
                padding: "8px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
              onClick={() => {
                const video = document.querySelector("video")
                if (video) {
                  const wasPaused = video.paused
                  video.currentTime = action.end
                    ? action.end / 1000
                    : action.start / 1000
                  if (!wasPaused) {
                    video.play()
                  }
                }
              }}>
              {action.end ? formatTime(action.end) : "進行中"}
            </td>
            <td style={{ padding: "8px" }}>
              {action.labels.join(", ") || "-"}
            </td>
            <td style={{ padding: "8px" }}>
              <button
                onClick={async () => {
                  const confirmed = window.confirm("本当に削除しますか？")
                  if (confirmed) {
                    await deleteAction(action.team, action.action, action.start)
                    if (onDelete)
                      await onDelete(action.team, action.action, action.start)
                  }
                }}
                style={{
                  padding: "2px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
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

export default TimelineTable
