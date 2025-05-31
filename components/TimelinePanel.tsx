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
          <TimelineActions
            onSave={onSave}
            exportActionsToCSV={exportActionsToCSV}
          />
        </div>
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "140px",
            position: "relative"
          }}>
          <TimelineTable actions={actions} onDelete={onDelete} />
        </div>
      </div>
    </Draggable>
  )
}

export default TimelinePanel
