import React, { useEffect, useRef, useState } from "react"

import { STYLES } from "../../constants"
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
  const [isComposingMain, setIsComposingMain] = useState(false)
  const [isComposingCategory, setIsComposingCategory] = useState(false)
  const [tempInputValue, setTempInputValue] = useState("")
  const [tempCategoryValue, setTempCategoryValue] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const initialFocusRef = useRef<HTMLInputElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いた時に一時的な値を初期化
      setTempInputValue(inputValue)
      setTempCategoryValue(category)

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
  }, [isOpen, onClose, inputValue, category])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTempInputValue(value)

    // IME入力中でない場合のみ親コンポーネントに通知
    if (!isComposingMain) {
      onInputChange(value)
    }
  }

  const handleCompositionStart = () => {
    setIsComposingMain(true)
  }

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposingMain(false)
    const value = e.currentTarget.value
    setTempInputValue(value)
    // IME入力完了時に最終的な値を親コンポーネントに送信
    onInputChange(value)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTempCategoryValue(value)

    // IME入力中でない場合のみカテゴリを更新
    if (!isComposingCategory) {
      setCategory(value)
    }
  }

  const handleCategoryCompositionStart = () => {
    setIsComposingCategory(true)
  }

  const handleCategoryCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposingCategory(false)
    const value = e.currentTarget.value
    setTempCategoryValue(value)
    setCategory(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // IME入力中の場合は一時的な値、そうでなければ通常の値を使用
    const finalInputValue = isComposingMain ? tempInputValue : inputValue
    if (finalInputValue.trim()) {
      onSubmit(hasCategory ? category : undefined)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      style={{ zIndex: STYLES.Z_INDEX.MODAL }}>
      <div
        role="document"
        className="bg-white p-5 rounded-lg shadow-lg"
        style={{ minWidth: "300px" }}>
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
                value={isComposingCategory ? tempCategoryValue : category}
                onChange={handleCategoryChange}
                onCompositionStart={handleCategoryCompositionStart}
                onCompositionEnd={handleCategoryCompositionEnd}
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
              value={isComposingMain ? tempInputValue : inputValue}
              onChange={handleInputChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={hasCategory ? "例: forehand, winner, error" : ""}
              className="w-full px-2 py-2 rounded border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              ref={initialFocusRef}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-gray-500 text-white rounded cursor-pointer text-sm hover:bg-gray-600 transition-colors">
              キャンセル
            </button>
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-emerald-600 text-white rounded cursor-pointer text-sm hover:bg-emerald-700 transition-colors">
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
