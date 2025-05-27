import React from "react"

interface ModalProps {
  isOpen: boolean
  inputValue: string
  modalType:
    | "action"
    | "label"
    | "team"
    | "buttonSet"
    | "buttonInSet"
    | "addAction"
    | "addLabel"
    | null
  onInputChange: (v: string) => void
  onClose: () => void
  onSubmit: () => void
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  inputValue,
  modalType,
  onInputChange,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px"
        }}>
        <h3>
          {modalType === "team"
            ? "チームを追加"
            : modalType === "action" || modalType === "addAction"
              ? "アクションを追加"
              : modalType === "addLabel"
                ? "ラベルを追加"
                : modalType === "buttonSet"
                  ? "ボタンセットを追加"
                  : modalType === "buttonInSet"
                    ? "ボタンセット内にアクションを追加"
                    : ""}
        </h3>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ced4da"
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px"
          }}>
          <button
            onClick={onClose}
            style={{
              padding: "5px 10px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            キャンセル
          </button>
          <button
            onClick={onSubmit}
            style={{
              padding: "5px 10px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
            追加
          </button>
        </div>
      </div>
    </div>
  )
}
