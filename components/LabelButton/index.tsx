import React from "react"

// LabelButtonコンポーネントは、ラベルを表すボタンを提供します。
// - label: ラベル名。
// - isActive: ボタンがアクティブかどうか。
// - isDisabled: ボタンが無効化されているかどうか。
// - onClick: ボタンがクリックされたときのコールバック。
interface LabelButtonProps {
  // ラベル名。
  label: string
  // ボタンがアクティブかどうか。
  isActive: boolean
  // ボタンが無効化されているかどうか。
  isDisabled: boolean
  // ボタンがクリックされたときのコールバック。
  onClick: (label: string) => void
}

export const LabelButton: React.FC<LabelButtonProps> = ({
  label, // ラベル名。
  isActive, // ボタンがアクティブかどうか。
  isDisabled, // ボタンが無効化されているかどうか。
  onClick // ボタンがクリックされたときのコールバック。
}) => (
  <button
    onClick={() => onClick(label)}
    disabled={isDisabled}
    style={{
      padding: "6px 10px",
      fontSize: "11px",
      fontWeight: "500",
      backgroundColor: isActive ? "#3b82f6" : "#ffffff",
      color: isActive ? "white" : "#374151",
      border: "1px solid",
      borderColor: isActive ? "#3b82f6" : "#d1d5db",
      borderRadius: "14px",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
      transition: "all 0.15s ease",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      whiteSpace: "nowrap" as "nowrap"
    }}
    onMouseEnter={(e) => {
      if (!isDisabled) {
        if (isActive) {
          e.currentTarget.style.backgroundColor = "#2563eb"
        } else {
          e.currentTarget.style.backgroundColor = "#f8fafc"
          e.currentTarget.style.borderColor = "#94a3b8"
        }
      }
    }}
    onMouseLeave={(e) => {
      if (!isDisabled) {
        if (isActive) {
          e.currentTarget.style.backgroundColor = "#3b82f6"
        } else {
          e.currentTarget.style.backgroundColor = "#ffffff"
          e.currentTarget.style.borderColor = "#d1d5db"
        }
      }
    }}>
    {label}
  </button>
)
