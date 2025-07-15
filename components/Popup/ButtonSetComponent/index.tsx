import React, { useState } from "react"

import type { Button, ButtonSet } from "../../../types/common"
import type { ButtonSetComponentProps } from "../../../types/components"
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

  // カテゴリ付きラベルのみを処理
  const getLabelsFromButtons = (
    labels: Record<string, string[]>
  ): Record<string, string[]> => {
    return labels
  }

  const handleActionClick = (action: string) => {
    const newSelection = selectedAction === action ? null : action
    console.log("ButtonSetComponent: Action clicked", {
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
          <div key={index} style={{ marginBottom: "16px" }}>
            {/* アクションボタン */}
            <ActionButton
              action={btn.action}
              onClick={() => handleActionClick(btn.action)}
              team={buttonSet.setName}
              isActive={selectedAction === btn.action}
            />
            {/* アクションに紐づくラベルボタン群 - カテゴリ別に表示 */}
            <div style={{ marginTop: "8px" }}>
              {Object.entries(labelsByCategory).map(([category, labels]) => (
                <div key={category} style={{ marginBottom: "4px" }}>
                  {/* カテゴリ名を常に表示 */}
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginBottom: "2px",
                      paddingLeft: "4px"
                    }}>
                    {category}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginLeft: "8px"
                    }}>
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
