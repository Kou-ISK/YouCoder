import React from "react"
import Draggable from "react-draggable"

import { exportActionsToCSV } from "../lib/actionsManager"
import TimelineActions from "./TimelineActions"
import TimelineTable from "./TimelineTable"

type Action = {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

interface TimelinePanelProps {
  actions: Action[]
  onDelete?: (team: string, action: string, start: number) => void
  onSave?: () => void
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave
}) => {
  return (
    <Draggable handle=".drag-handle">
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          width: "85%",
          maxWidth: "1200px",
          maxHeight: "300px",
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          zIndex: 1000,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
        <div
          className="drag-handle"
          style={{
            cursor: "move",
            padding: "4px",
            marginBottom: "8px",
            borderRadius: "4px"
          }}>
          <div
            style={{
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151"
              }}>
              Timeline
            </span>
            <div
              style={{
                width: "20px",
                height: "4px",
                backgroundColor: "#d1d5db",
                borderRadius: "2px"
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: "1px solid #e5e7eb"
          }}>
          <TimelineActions
            onSave={onSave}
            exportActionsToCSV={() => {
              exportActionsToCSV(actions)
            }}
          />
        </div>

        <div
          style={{
            overflowY: "auto",
            maxHeight: "200px"
          }}>
          <TimelineTable actions={actions} onDelete={onDelete} />
        </div>
      </div>
    </Draggable>
  )
}

export default TimelinePanel
