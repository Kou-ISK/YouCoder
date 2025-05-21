import React from "react"

interface LabelListProps {
  labels: Record<string, string>
  onAdd: () => void
  onRemove: (label: string) => void
}

export const LabelList: React.FC<LabelListProps> = ({
  labels,
  onAdd,
  onRemove
}) => (
  <div style={{ marginBottom: "20px" }}>
    <h3>ラベル</h3>
    <button
      onClick={onAdd}
      style={{
        marginBottom: "10px",
        padding: "5px 10px",
        backgroundColor: "#007bff",
        color: "white",
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
          <span>{label}</span>
          <button
            onClick={() => onRemove(label)}
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
        </div>
      ))}
    </div>
  </div>
)
