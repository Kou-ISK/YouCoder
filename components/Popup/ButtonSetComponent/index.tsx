import React, { useState } from "react"

import type { Button, ButtonSet } from "../../../types/common"
import type { ButtonSetComponentProps } from "../../../types/components"
import { logger } from "../../../utils/errorHandling"
import { ActionButton } from "../../ActionButton"
import { LabelButton } from "../../LabelButton"

const ButtonSetComponent: React.FC<ButtonSetComponentProps> = ({
  buttonSet,
  selectedAction,
  onUpdateButtonSet,
  onActionSelect
}) => {
  if (!buttonSet) {
    return <div>選択されたボタンセットがありません</div>
  }

  const getLabelsFromButtons = (
    labels: Record<string, string[]>
  ): Record<string, string[]> => {
    return labels
  }

  const handleActionClick = (action: string) => {
    const newSelection = selectedAction === action ? null : action
    logger.debug("ButtonSetComponent: Action clicked", {
      action,
      currentSelection: selectedAction,
      newSelection
    })
    onActionSelect(newSelection)
  }

  return (
    <div>
      {buttonSet.buttons.map((btn, index) => {
        const labelsByCategory = getLabelsFromButtons(btn.labels)

        return (
          <div key={index} className="mb-4">
            {/* アクションボタン */}
            <ActionButton
              action={btn.action}
              onClick={() => handleActionClick(btn.action)}
              team={buttonSet.setName}
              isActive={selectedAction === btn.action}
            />
            {/* アクションに紐づくラベルボタン群 - カテゴリ別に表示 */}
            <div className="mt-2">
              {Object.entries(labelsByCategory).map(([category, labels]) => (
                <div key={category} className="mb-1">
                  {/* カテゴリ名を常に表示 */}
                  <div className="text-xs font-semibold text-gray-500 mb-0.5 pl-1">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-1 ml-2">
                    {labels.map((lbl, i) => {
                      const displayLabel = `${category} - ${lbl}`
                      return (
                        <LabelButton
                          key={i}
                          label={lbl}
                          isActive={false}
                          isDisabled={true}
                          onClick={() => {
                            // カテゴリ付きラベルは読み取り専用
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ButtonSetComponent
