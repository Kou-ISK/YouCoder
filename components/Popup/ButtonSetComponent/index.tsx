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
    <div className="space-y-2">
      {/* 操作説明 */}
      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md border border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">💡</span>
          <span>
            <strong>アクションを選択</strong>してラベルを表示・確認できます
          </span>
        </div>
      </div>

      {/* アクションリスト */}
      <div className="space-y-1">
        {buttonSet.buttons.map((btn, index) => {
          const labelsByCategory = getLabelsFromButtons(btn.labels)
          const isSelected = selectedAction === btn.action
          const hasLabels = Object.keys(labelsByCategory).length > 0

          return (
            <div
              key={index}
              className={`p-2 rounded-md border transition-all duration-200 ${
                isSelected
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}>
              {/* アクション部分 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-shrink-0">
                    <ActionButton
                      action={btn.action}
                      onClick={() => handleActionClick(btn.action)}
                      team={buttonSet.setName}
                      isActive={isSelected}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {hasLabels ? (
                        <>
                          <span className="text-green-600">🏷️</span>
                          <span>
                            ラベル設定済み (
                            {Object.keys(labelsByCategory).length}カテゴリ)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">📝</span>
                          <span>ラベル未設定</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 展開/折りたたみインジケーター */}
                <div className="flex-shrink-0 ml-2">
                  {hasLabels && (
                    <span
                      className={`text-xs text-gray-400 transition-transform duration-200 ${
                        isSelected ? "rotate-90" : ""
                      }`}>
                      ▶
                    </span>
                  )}
                </div>
              </div>

              {/* ラベル表示部分 - 選択時のみ表示 */}
              {isSelected && hasLabels && (
                <div className="mt-2 pl-2 border-l-2 border-blue-300">
                  <div className="space-y-1">
                    {Object.entries(labelsByCategory).map(
                      ([category, labels]) => (
                        <div
                          key={category}
                          className="bg-gray-50 p-1.5 rounded-sm">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            🏷️ {category}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(labels)
                              ? labels.map((lbl, i) => (
                                  <LabelButton
                                    key={i}
                                    label={lbl}
                                    isActive={false}
                                    isDisabled={true}
                                    onClick={() => {
                                      // カテゴリ付きラベルは読み取り専用
                                    }}
                                  />
                                ))
                              : null}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ラベル未設定時の案内 */}
              {isSelected && !hasLabels && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <div className="text-xs text-yellow-700 flex items-center gap-1">
                    <span>💡</span>
                    <span>
                      このアクションにはまだラベルが設定されていません
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* アクション未登録時の表示 */}
      {buttonSet.buttons.length === 0 && (
        <div className="text-center p-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
          <div className="text-gray-400 text-xs">
            📝 アクションがまだ登録されていません
          </div>
          <div className="text-gray-400 text-xs mt-1">
            「アクション追加」ボタンから作成してください
          </div>
        </div>
      )}
    </div>
  )
}

export default ButtonSetComponent
