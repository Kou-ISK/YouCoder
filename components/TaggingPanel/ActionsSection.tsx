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
 * アクションセクションコンポーネント
 * チーム別のアクションボタンを表示する
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
    <section
      className="mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-lg"
      aria-labelledby="actions-section-title">
      <div className="mb-4">
        <h3
          id="actions-section-title"
          className="text-sm font-bold text-blue-800 mb-2 flex items-center">
          <span className="mr-2 text-lg">⚡</span>
          アクション選択
        </h3>
        <div className="h-px bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300"></div>
      </div>

      <TeamsHeader teams={teams} />
      <ActionsGrid
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={onActionToggle}
      />
    </section>
  )
}

interface TeamsHeaderProps {
  teams: string[]
}

/**
 * チームヘッダーコンポーネント
 */
const TeamsHeader: React.FC<TeamsHeaderProps> = ({ teams }) => (
  <div className="mb-4">
    <div className="grid grid-cols-[minmax(100px,auto)_1fr] gap-3 mb-3">
      {/* アクションラベル列ヘッダー */}
      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-center border border-gray-200">
        Actions
      </div>

      {/* チーム列ヘッダー */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
        {teams.map((team, index) => (
          <div
            key={team}
            className={`text-center text-sm font-bold text-white py-3 px-2 rounded-lg shadow-md border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${getTeamColorClass(
              index
            )}`}
            title={team}>
            <div className="truncate">{team}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="border-b-2 border-blue-200"></div>
  </div>
)

interface ActionsGridProps {
  teams: string[]
  actions: Record<string, string>
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
}

/**
 * アクショングリッドコンポーネント
 */
const ActionsGrid: React.FC<ActionsGridProps> = ({
  teams,
  actions,
  activeActions,
  onActionToggle
}) => (
  <div className="space-y-2">
    {Object.keys(actions).map((action) => (
      <ActionRow
        key={action}
        action={action}
        actionLabel={actions[action]}
        teams={teams}
        activeActions={activeActions}
        onActionToggle={onActionToggle}
      />
    ))}
  </div>
)

interface ActionRowProps {
  action: string
  actionLabel: string
  teams: string[]
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
}

/**
 * アクション行コンポーネント
 */
const ActionRow: React.FC<ActionRowProps> = ({
  action,
  actionLabel,
  teams,
  activeActions,
  onActionToggle
}) => (
  <div
    className="grid grid-cols-[minmax(100px,auto)_1fr] gap-3 py-2 px-1 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200"
    role="group"
    aria-label={`${actionLabel}アクション`}>
    {/* アクションラベル */}
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg px-3 py-2 flex items-center justify-center border border-gray-300 shadow-sm">
      <span
        className="text-xs font-bold text-gray-700 text-center leading-tight"
        title={actionLabel}>
        {actionLabel}
      </span>
    </div>

    {/* チーム別ボタングリッド */}
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
      {teams.map((team, index) => (
        <div key={`${team}-${action}`} className="min-w-0">
          <ActionButton
            team={team}
            action={actionLabel}
            isActive={activeActions.has(`${team}_${action}`)}
            onClick={() => onActionToggle(team, action)}
            colorClass={getTeamColorClass(index)}
          />
        </div>
      ))}
    </div>
  </div>
)
