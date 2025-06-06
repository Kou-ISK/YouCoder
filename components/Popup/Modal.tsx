import React, { useState } from "react"

interface ModalProps {
  isOpen: boolean
  inputValue: string
  m          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                e.preventDefault()
                onSubmit(isCategorizedLabel ? category : undefined)
              }
            }}
            placeholder={
              isCategorizedLabel ? "例: forehand, winner, error" : ""
            }
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ced4da"
            }}
            data-testid="modal-input"
            autoFocus={true}ion"
    | "label"
    | "team"
    | "buttonSet"
    | "buttonInSet"
    | "addAction"
    | "addLabel"
    | "addCategorizedLabel"
    | null
  onInputChange: (v: string) => void
  onClose: () => void
  onSubmit: (category?: string) => void
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  inputValue,
  modalType,
  onInputChange,
  onClose,
  onSubmit
}) => {
  const [category, setCategory] = useState("一般")

  console.log("Modal render:", { isOpen, inputValue, modalType })

  if (!isOpen) return null

  const isCategorizedLabel = modalType === "addCategorizedLabel"
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
                : modalType === "addCategorizedLabel"
                  ? "カテゴリ付きラベルを追加"
                  : modalType === "buttonSet"
                    ? "ボタンセットを追加"
                    : modalType === "buttonInSet"
                      ? "ボタンセット内にアクションを追加"
                      : ""}
        </h3>

        {/* カテゴリ付きラベルの場合、カテゴリ選択フィールドを表示 */}
        {isCategorizedLabel && (
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "600"
              }}>
              カテゴリ:
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: Shot Type, Result, Position"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "600"
            }}>
            {isCategorizedLabel ? "ラベル:" : "入力:"}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                e.preventDefault()
                onSubmit(isCategorizedLabel ? category : undefined)
              }
            }}
            placeholder={
              isCategorizedLabel ? "例: forehand, winner, error" : ""
            }
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ced4da"
            }}
            data-testid="modal-input"
            autoFocus={true}="autoFocus"
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px"
          }}>
          <button
            type="button"
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
            type="button"
            onClick={() => {
              console.log(
                "Modal submit button clicked, modalType:",
                modalType,
                "inputValue:",
                inputValue,
                "category:",
                category,
                "inputValue.trim():",
                inputValue.trim(),
                "inputValue.trim() length:",
                inputValue.trim().length
              )
              console.log("Calling onSubmit...")
              onSubmit(isCategorizedLabel ? category : undefined)
            }}
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
