import React from "react"

import type { TeamListProps } from "../../../types/components"

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onAdd,
  onRemove
}) => (
  <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
    <h3 className="m-0 mb-3 text-base font-medium text-gray-800">チーム</h3>
    <button
      onClick={onAdd}
      className="mb-3 px-4 py-2 text-xs font-medium bg-blue-500 text-white border-none rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-600">
      チームを追加
    </button>
    <div className="flex flex-col gap-2">
      {teams.map((team) => (
        <div
          key={team}
          className="flex justify-between items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          <span className="text-sm text-gray-700">{team}</span>
          <button
            onClick={() => onRemove(team)}
            className="px-2 py-1 text-xs font-medium bg-red-500 text-white border-none rounded cursor-pointer transition-all duration-200 hover:bg-red-600">
            削除
          </button>
        </div>
      ))}
    </div>
  </div>
)
