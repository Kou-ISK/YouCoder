import React from "react"

import type { LabelListProps } from "../../../types/components"

export const LabelList: React.FC<LabelListProps> = ({
  labels,
  onAdd,
  onRemove
}) => (
  <div style={{ marginBottom: "20px" }}>
    <h3>ラベル</h3>
    <button
      type="button"
      onClick={onAdd}
      style={{
        marginBottom: "10px",
        padding: "5px 10px",
        backgroundColor: "#007bff",
        color: "rgb(255, 255, 255)",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}>
      ラベルを追加
    </button>
    <div>
      {Object.keys(labels).map((label) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "5px",
            padding: "5px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px"
          }}>
          <span>{labels[label]}</span>
          <button
            type="button"
            onClick={() => onRemove(label)}
            style={{
              padding: "2px 8px",
              backgroundColor: "#dc3545",
              color: "rgb(255, 255, 255)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            削除
          </button>
        </div>
      ))}
    </div>
  </div>
)
