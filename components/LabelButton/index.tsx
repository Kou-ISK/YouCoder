import React from "react"

import type { LabelButtonProps } from "../../types/components"

/**
 * LabelButtonコンポーネント - ラベルを表すボタンを提供
 */
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
      px-1.5 py-0.5 text-xs font-medium rounded-sm transition-all duration-200 
      border shadow-sm hover:shadow-md
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50
      min-w-[50px] flex items-center justify-center
      ${
        isActive
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 hover:from-green-600 hover:to-emerald-600"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
      }
      ${
        isDisabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:scale-[1.02]"
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
