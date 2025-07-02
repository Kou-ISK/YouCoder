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
    className={`
      px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 
      border-2 shadow-sm hover:shadow-md transform hover:scale-105
      ${
        isActive
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 hover:from-green-600 hover:to-emerald-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      }
      ${
        isDisabled
          ? "opacity-50 cursor-not-allowed transform-none hover:scale-100 hover:shadow-sm"
          : "cursor-pointer"
      }
    `}
    style={{
      whiteSpace: "nowrap" as "nowrap",
      minWidth: "fit-content"
    }}>
    {label}
  </button>
)
