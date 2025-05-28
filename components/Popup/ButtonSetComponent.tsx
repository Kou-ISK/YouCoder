import React, { useState } from "react"

import { ActionButton } from "../ActionButton"
import { LabelButton } from "../LabelButton"

type Button = {
  action: string
  labels: string[]
}

type ButtonSet = {
  setName: string
  buttons: Button[]
}

type ButtonSetComponentProps = {
  buttonSet: ButtonSet | undefined
  onUpdateButtonSet: (updatedSet: ButtonSet) => void
}

const ButtonSetComponent: React.FC<ButtonSetComponentProps> = ({
  buttonSet,
  onUpdateButtonSet
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  if (!buttonSet) {
    return <div>選択されたボタンセットがありません</div>
  }

  const handleActionClick = (action: string) => {
    setSelectedAction((prev) => (prev === action ? null : action))
  }

  const handleAddLabelToAction = (action: string, label: string) => {
    if (!buttonSet) return
    const updatedButtons = buttonSet.buttons.map((btn) => {
      if (btn.action === action) {
        if (!btn.labels.includes(label)) {
          return { ...btn, labels: [...btn.labels, label] }
        }
      }
      return btn
    })
    // 更新されたボタンセットを反映
    const updatedButtonSet = { ...buttonSet, buttons: updatedButtons }
    // 親コンポーネントに更新を通知
    onUpdateButtonSet(updatedButtonSet)
  }

  // アクションのラベルを編集・削除する関数を追加
  const handleRemoveLabelFromAction = (action: string, label: string) => {
    if (!buttonSet) return
    const updatedButtons = buttonSet.buttons.map((btn) => {
      if (btn.action === action) {
        return { ...btn, labels: btn.labels.filter((l) => l !== label) }
      }
      return btn
    })
    const updatedButtonSet = { ...buttonSet, buttons: updatedButtons }
    onUpdateButtonSet(updatedButtonSet)
  }

  return (
    <div>
      {buttonSet.buttons.map((btn, index) => (
        <div key={index} style={{ marginBottom: "16px" }}>
          {/* アクションボタン */}
          <ActionButton
            action={btn.action}
            onClick={() => handleActionClick(btn.action)}
            team={buttonSet.setName}
            isActive={selectedAction === btn.action}
          />
          {/* アクションに紐づくラベルボタン群 */}
          <div style={{ marginTop: "8px" }}>
            {btn.labels.map((lbl, i) => (
              <LabelButton
                key={i}
                label={lbl}
                isActive={selectedAction === btn.action}
                isDisabled={selectedAction !== btn.action}
                onClick={() => {
                  // ラベル追加処理の例
                  handleAddLabelToAction(btn.action, lbl)
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ButtonSetComponent
