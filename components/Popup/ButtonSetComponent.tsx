import React, { useState } from "react"

import { ActionButton } from "../ActionButton"
import { LabelButton } from "../LabelButton"

type Button = {
  action: string
  labels: Record<string, string[]> | string[] // 新旧両方の形式をサポート
}

type ButtonSet = {
  setName: string
  buttons: Button[]
}

type ButtonSetComponentProps = {
  buttonSet: ButtonSet | undefined
  selectedAction: string | null
  onUpdateButtonSet: (updatedSet: ButtonSet) => void
  onActionSelect: (action: string | null) => void
}

const ButtonSetComponent: React.FC<ButtonSetComponentProps> = ({
  buttonSet,
  selectedAction,
  onUpdateButtonSet,
  onActionSelect
}) => {
  if (!buttonSet) {
    return <div>選択されたボタンセットがありません</div>
  }

  // ラベル形式を正規化する関数
  const normalizeLabelsToCategorized = (
    labels: Record<string, string[]> | string[]
  ): Record<string, string[]> => {
    if (Array.isArray(labels)) {
      return { 一般: labels }
    }
    return labels
  }

  const normalizeLabelsToFlat = (
    labels: Record<string, string[]> | string[]
  ): string[] => {
    if (Array.isArray(labels)) {
      return labels
    }
    return Object.values(labels).flat()
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

  const handleAddLabelToAction = (action: string, label: string) => {
    if (!buttonSet) return
    const updatedButtons = buttonSet.buttons.map((btn) => {
      if (btn.action === action) {
        const flatLabels = normalizeLabelsToFlat(btn.labels)
        if (!flatLabels.includes(label)) {
          // 新しいラベルを追加する場合、既存の形式を保持
          if (Array.isArray(btn.labels)) {
            return { ...btn, labels: [...btn.labels, label] }
          } else {
            // カテゴリ付きの場合、"一般"カテゴリに追加
            const categorized = { ...btn.labels }
            if (!categorized["一般"]) {
              categorized["一般"] = []
            }
            categorized["一般"] = [...categorized["一般"], label]
            return { ...btn, labels: categorized }
          }
        }
      }
      return btn
    })
    const updatedButtonSet = { ...buttonSet, buttons: updatedButtons }
    onUpdateButtonSet(updatedButtonSet)
  }

  const handleRemoveLabelFromAction = (action: string, label: string) => {
    if (!buttonSet) return
    const updatedButtons = buttonSet.buttons.map((btn) => {
      if (btn.action === action) {
        if (Array.isArray(btn.labels)) {
          return { ...btn, labels: btn.labels.filter((l) => l !== label) }
        } else {
          // カテゴリ付きの場合、該当するカテゴリから削除
          const categorized = { ...btn.labels }
          for (const [category, labels] of Object.entries(categorized)) {
            categorized[category] = labels.filter((l) => l !== label)
            // 空になったカテゴリは削除
            if (categorized[category].length === 0) {
              delete categorized[category]
            }
          }
          return { ...btn, labels: categorized }
        }
      }
      return btn
    })
    const updatedButtonSet = { ...buttonSet, buttons: updatedButtons }
    onUpdateButtonSet(updatedButtonSet)
  }

  return (
    <div>
      {buttonSet.buttons.map((btn, index) => {
        const flatLabels = normalizeLabelsToFlat(btn.labels)
        const categorizedLabels = normalizeLabelsToCategorized(btn.labels)

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
              {Object.entries(categorizedLabels).map(([category, labels]) => (
                <div key={category} style={{ marginBottom: "4px" }}>
                  {/* カテゴリが "一般" 以外の場合のみカテゴリ名を表示 */}
                  {category !== "一般" && (
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
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginLeft: category !== "一般" ? "8px" : "0px"
                    }}>
                    {labels.map((lbl, i) => {
                      const displayLabel =
                        category === "一般" ? lbl : `${category} - ${lbl}`
                      return (
                        <LabelButton
                          key={i}
                          label={lbl}
                          isActive={selectedAction === btn.action}
                          isDisabled={selectedAction !== btn.action}
                          onClick={() => {
                            handleAddLabelToAction(btn.action, displayLabel)
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
