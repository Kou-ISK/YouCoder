import React from "react"

import { ActionButton } from "~components/ActionButton"

interface ActionsSectionProps {
  teams: string[]
  actions: Record<string, string>
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
}

/**
 * チームインデックスに基づいてカラークラスを取得する
 */
const getTeamColorClass = (index: number): string => {
  const colors = [
    "bg-gradient-to-r from-blue-500 to-blue-600",
    "bg-gradient-to-r from-green-500 to-green-600",
    "bg-gradient-to-r from-purple-500 to-purple-600",
    "bg-gradient-to-r from-orange-500 to-orange-600",
    "bg-gradient-to-r from-red-500 to-red-600",
    "bg-gradient-to-r from-cyan-500 to-cyan-600",
    "bg-gradient-to-r from-pink-500 to-pink-600",
    "bg-gradient-to-r from-yellow-500 to-yellow-600"
  ]
  return colors[index % colors.length]
}

/**
 * アクションセクションコンポーネント - シンプルなテーブル形式
 * チームヘッダーの下にアクションボタンを配置するクリーンなレイアウト
 */
export const ActionsSection: React.FC<ActionsSectionProps> = ({
  teams,
  actions,
  activeActions,
  onActionToggle
}) => {
  if (teams.length === 0 || Object.keys(actions).length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      {/* チームヘッダー */}
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
        {teams.map((team, index) => (
          <div
            key={team}
            className={`py-2 px-3 text-center text-sm font-medium text-white rounded-lg shadow-sm ${getTeamColorClass(index)}`}>
            {team}
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      {Object.keys(actions).map((action) => (
        <div
          key={action}
          className="grid gap-2 mb-2"
          style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
          {teams.map((team, teamIndex) => (
            <div key={`${team}-${action}`} className="flex justify-center">
              <ActionButton
                team={team}
                action={actions[action]}
                isActive={activeActions.has(`${team}_${action}`)}
                onClick={() => onActionToggle(team, action)}
                colorClass={getTeamColorClass(teamIndex)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
