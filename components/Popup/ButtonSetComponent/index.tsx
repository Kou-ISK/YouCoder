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
  if (!buttonSet || !buttonSet.buttons || !Array.isArray(buttonSet.buttons)) {
    logger.warn("ButtonSetComponent: Invalid buttonSet or buttons data", {
      buttonSet,
      hasButtonSet: !!buttonSet,
      hasButtons: buttonSet?.buttons !== undefined,
      isButtonsArray: Array.isArray(buttonSet?.buttons),
      buttonSetType: typeof buttonSet,
      buttonsType: typeof buttonSet?.buttons
    })
    return (
      <div className="p-4 text-center text-gray-500">
        選択されたボタンセットがありません
      </div>
    )
  }

  if (buttonSet.buttons.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>このボタンセットにはアクションが登録されていません</p>
        <p className="text-sm mt-2">
          「アクション追加」ボタンからアクションを追加してください
        </p>
      </div>
    )
  }

  const getLabelsFromButtons = (
    labels: Record<string, string[]>
  ): Record<string, string[]> => {
    // labelsがnullやundefinedの場合の対応
    if (!labels || typeof labels !== "object") {
      logger.warn("ButtonSetComponent: Invalid labels data", { labels })
      return {}
    }

    // 各カテゴリのラベルが配列でない場合の対応
    const normalizedLabels: Record<string, string[]> = {}
    for (const [category, categoryLabels] of Object.entries(labels)) {
      if (Array.isArray(categoryLabels)) {
        normalizedLabels[category] = categoryLabels
      } else {
        logger.warn("ButtonSetComponent: Invalid category labels", {
          category,
          categoryLabels,
          type: typeof categoryLabels
        })
        normalizedLabels[category] = []
      }
    }

    return normalizedLabels
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
                    {Array.isArray(labels)
                      ? labels.map((lbl, i) => {
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
                        })
                      : null}
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
