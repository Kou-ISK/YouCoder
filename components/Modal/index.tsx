import React, { useEffect, useRef, useState } from "react"

import type { ModalProps } from "../../types/components"

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

  const hasCategory = modalType === "addLabel"
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
      onSubmit(hasCategory ? category : undefined)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div
        role="document"
        className="bg-white p-5 rounded-lg min-w-75 shadow-lg">
        <h3
          id="modal-title"
          className="text-lg font-semibold mb-4 text-gray-800">
          {modalTitle}
        </h3>
        <form role="form" onSubmit={handleSubmit}>
          {hasCategory && (
            <div className="mb-2.5">
              <label
                htmlFor="category-input"
                className="block mb-1 font-semibold text-sm text-gray-700">
                カテゴリ:
              </label>
              <input
                id="category-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例: Shot Type, Result, Position"
                className="w-full px-2 py-2 rounded border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          )}

          <div className="mb-2.5">
            <label
              htmlFor="main-input"
              className="block mb-1 font-semibold text-sm text-gray-700">
              {hasCategory ? "ラベル:" : "入力:"}
            </label>
            <input
              id="main-input"
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={hasCategory ? "例: forehand, winner, error" : ""}
              className="w-full px-2 py-2 rounded border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              ref={initialFocusRef}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-gray-500 text-white border-none rounded cursor-pointer text-sm hover:bg-gray-600 transition-colors">
              キャンセル
            </button>
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-emerald-600 text-white border-none rounded cursor-pointer text-sm hover:bg-emerald-700 transition-colors">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
