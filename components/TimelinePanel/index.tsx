import React from "react"
import Draggable from "react-draggable"

import { TimelineActions } from "~components/TimelineActions"
import { TimelineTable } from "~components/TimelineTable"
import { exportActionsToCSV } from "~lib/actionsManager"

import type { TimelinePanelProps } from "./types"

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  actions,
  onDelete,
  onSave,
  onExportCSV,
  onSeek
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
            marginBottom: "4px",
            display: "flex",
            justifyContent: "center",
            height: "8px"
          }}>
          <div
            style={{
              width: "20px",
              height: "4px",
              backgroundColor: "#d1d5db",
              borderRadius: "2px"
            }}
          />
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
            onSave={onSave || (() => {})}
            exportActionsToCSV={() => {
              if (onExportCSV) {
                onExportCSV()
              } else {
                exportActionsToCSV(actions)
              }
            }}
          />
        </div>

        <div
          style={{
            overflowY: "auto",
            maxHeight: "200px"
          }}>
          <TimelineTable
            actions={actions}
            onDelete={onDelete}
            onSeek={onSeek}
          />
        </div>
      </div>
    </Draggable>
  )
}
