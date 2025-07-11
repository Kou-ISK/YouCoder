import React, { useEffect, useRef, useState } from "react"

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
  const [category, setCategory] = useState("Result")
  const modalRef = useRef<HTMLDivElement>(null)
  const initialFocusRef = useRef<HTMLInputElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      // モーダルを開いた時に前のフォーカス要素を保存
      previousActiveElement.current = document.activeElement
      // モーダルを開いた時に入力フィールドにフォーカス
      initialFocusRef.current?.focus()

      // ESCキーでモーダルを閉じる
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose()
        }
      }
      document.addEventListener("keydown", handleEscape)
      return () => {
        document.removeEventListener("keydown", handleEscape)
        // モーダルを閉じた時に前のフォーカス要素に戻す
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus()
        }
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isCategorizedLabel = modalType === "addLabel"
  const modalTitle =
    modalType === "team"
      ? "チームを追加"
      : modalType === "action" || modalType === "addAction"
        ? "アクションを追加"
        : modalType === "addLabel"
          ? "ラベルを追加"
          : modalType === "buttonSet"
            ? "ボタンセットを追加"
            : modalType === "buttonInSet"
              ? "ボタンセット内にアクションを追加"
              : ""

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(isCategorizedLabel ? category : undefined)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
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
        role="document"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px"
        }}>
        <h3 id="modal-title">{modalTitle}</h3>
        <form role="form" onSubmit={handleSubmit}>
          {isCategorizedLabel && (
            <div style={{ marginBottom: "10px" }}>
              <label
                htmlFor="category-input"
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "600"
                }}>
                カテゴリ:
              </label>
              <input
                id="category-input"
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
              htmlFor="main-input"
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "600"
              }}>
              {isCategorizedLabel ? "ラベル:" : "入力:"}
            </label>
            <input
              id="main-input"
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={
                isCategorizedLabel ? "例: forehand, winner, error" : ""
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
              ref={initialFocusRef}
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
              type="submit"
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
        </form>
      </div>
    </div>
  )
}
