import React from "react"

import { ActionButton } from "~components/ActionButton"

interface ActionsSectionProps {
  teams: string[]
  actions: Record<string, string>
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
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
    <section className="mb-4" aria-labelledby="actions-section-title">
      <h3 id="actions-section-title" className="sr-only">
        アクション選択
      </h3>

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
  <div className="flex gap-3 mb-2 border-b border-gray-200 pb-2">
    {teams.map((team) => (
      <div
        key={team}
        className="flex-1 min-w-0 text-center text-sm font-semibold text-gray-700 py-1 px-2 bg-gray-50 rounded border border-gray-200 truncate"
        title={team}>
        {team}
      </div>
    ))}
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
  <div className="flex flex-col gap-1.5">
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
    className="flex items-center gap-2 py-1"
    role="group"
    aria-label={`${actionLabel}アクション`}>
    <div className="flex gap-1.5 flex-1 min-w-0">
      {teams.map((team) => (
        <div key={`${team}-${action}`} className="flex-1 min-w-0">
          <ActionButton
            team={team}
            action={actionLabel}
            isActive={activeActions.has(`${team}_${action}`)}
            onClick={() => onActionToggle(team, action)}
          />
        </div>
      ))}
    </div>
  </div>
)
