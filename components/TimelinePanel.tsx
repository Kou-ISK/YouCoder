import React from "react"
import Draggable from "react-draggable"

import { deleteAction, exportActionsToCSV } from "../lib/actionsManager"

type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

interface TimelinePanelProps {
  actions: Action[]
  onDelete?: () => void
  onSave?: () => void
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave
}) => {
  const formatTime = (timestamp: number) => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = timestamp % 1000

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`
  }

  return (
    <Draggable>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          width: "80%",
          maxHeight: "200px",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "auto",
          cursor: "move",
          zIndex: 1000
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8
          }}>
          <h3
            style={{
              margin: "0 0 10px 0",
              paddingBottom: "5px",
              borderBottom: "1px solid #eee"
            }}>
            タイムライン
          </h3>
          <div>
            <button
              onClick={exportActionsToCSV}
              style={{
                padding: "6px 12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                marginRight: "10px"
              }}>
              CSV出力
            </button>
            <button
              onClick={onSave}
              style={{
                padding: "6px 12px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px"
              }}>
              保存
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px"
            }}>
            <thead>
              <tr>
                <th style={{ padding: "8px", textAlign: "left" }}>チーム</th>
                <th style={{ padding: "8px", textAlign: "left" }}>
                  アクション
                </th>
                <th style={{ padding: "8px", textAlign: "left" }}>開始時間</th>
                <th style={{ padding: "8px", textAlign: "left" }}>終了時間</th>
                <th style={{ padding: "8px", textAlign: "left" }}>ラベル</th>
                <th style={{ padding: "8px", textAlign: "left" }}></th>
              </tr>
            </thead>
            <tbody>
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
                          await deleteAction(
                            action.team,
                            action.action,
                            action.start
                          )
                          if (onDelete) await onDelete()
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
        </div>
      </div>
    </Draggable>
  )
}

export default TimelinePanel
