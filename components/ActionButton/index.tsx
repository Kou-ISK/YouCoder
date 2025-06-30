import React from "react"

// ActionButtonコンポーネントは、アクションを表すボタンを提供します。
// - team: アクションが属するチーム名。
// - action: アクション名。
// - isActive: ボタンがアクティブかどうか。
// - onClick: ボタンがクリックされたときのコールバック。
// - colorClass: チームごとの色クラス（オプション）。
interface ActionButtonProps {
  team: string
  action: string
  isActive: boolean
  onClick: (team: string, action: string) => void
  colorClass?: string
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  team,
  action,
  isActive,
  onClick,
  colorClass
}) => {
  // チームカラーに基づくTailwindクラスを生成
  const getButtonClasses = () => {
    const baseClasses =
      "w-full px-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 border-2 shadow-sm hover:shadow-md transform hover:scale-105 truncate cursor-pointer"

    if (!colorClass) {
      return `${baseClasses} ${
        isActive
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
      }`
    }

    // チームカラーに基づくクラス設定
    const colorClassMap: Record<string, { active: string; inactive: string }> =
      {
        "bg-gradient-to-r from-blue-500 to-blue-600": {
          active:
            "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600",
          inactive:
            "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-400"
        },
        "bg-gradient-to-r from-green-500 to-green-600": {
          active:
            "bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600",
          inactive:
            "bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400"
        },
        "bg-gradient-to-r from-purple-500 to-purple-600": {
          active:
            "bg-purple-500 hover:bg-purple-600 text-white border-purple-500 hover:border-purple-600",
          inactive:
            "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 hover:border-purple-400"
        },
        "bg-gradient-to-r from-orange-500 to-orange-600": {
          active:
            "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600",
          inactive:
            "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 hover:border-orange-400"
        },
        "bg-gradient-to-r from-red-500 to-red-600": {
          active:
            "bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600",
          inactive:
            "bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400"
        },
        "bg-gradient-to-r from-cyan-500 to-cyan-600": {
          active:
            "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 hover:border-cyan-600",
          inactive:
            "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-300 hover:border-cyan-400"
        },
        "bg-gradient-to-r from-pink-500 to-pink-600": {
          active:
            "bg-pink-500 hover:bg-pink-600 text-white border-pink-500 hover:border-pink-600",
          inactive:
            "bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-300 hover:border-pink-400"
        },
        "bg-gradient-to-r from-yellow-500 to-yellow-600": {
          active:
            "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600",
          inactive:
            "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300 hover:border-yellow-400"
        }
      }

    const colorConfig =
      colorClassMap[colorClass] ||
      colorClassMap["bg-gradient-to-r from-blue-500 to-blue-600"]
    const stateClasses = isActive ? colorConfig.active : colorConfig.inactive

    return `${baseClasses} ${stateClasses}`
  }

  return (
    <button
      onClick={() => onClick(team, action)}
      className={getButtonClasses()}
      title={`${team}: ${action}`}>
      {action}
    </button>
  )
}
