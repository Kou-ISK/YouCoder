import React from "react"

import type { LabelButtonProps } from "../../types/components"

// LabelButtonコンポーネントは、ラベルを表すボタンを提供します。
// - label: ラベル名。
// - isActive: ボタンがアクティブかどうか。
// - isDisabled: ボタンが無効化されているかどうか。
// - onClick: ボタンがクリックされたときのコールバック。

export const LabelButton: React.FC<LabelButtonProps> = ({
  label,
  isActive,
  isDisabled,
  onClick
}) => (
  <button
    onClick={() => onClick(label)}
    disabled={isDisabled}
    className={`
      px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 
      border-2 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5
      focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50
      min-w-[100px] flex items-center justify-center
      ${
        isActive
          ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white border-green-400 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-green-200"
          : "bg-gradient-to-r from-white to-gray-50 text-gray-700 border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 hover:text-blue-700"
      }
      ${
        isDisabled
          ? "opacity-50 cursor-not-allowed transform-none hover:scale-100 hover:translate-y-0 hover:shadow-lg"
          : "cursor-pointer active:scale-95"
      }
    `}
    title={`${label}ラベル (${isActive ? "選択中" : "未選択"})`}
    aria-label={`${label}ラベル (${isActive ? "選択中" : "未選択"})`}
    style={{
      whiteSpace: "nowrap" as "nowrap",
      minWidth: "fit-content"
    }}>
    <span className="truncate">{label}</span>
  </button>
)
