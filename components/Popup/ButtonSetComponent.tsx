import React from "react"

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
}

const ButtonSetComponent: React.FC<ButtonSetComponentProps> = ({
  buttonSet
}) => {
  if (!buttonSet) {
    return <div>選択されたボタンセットがありません</div>
  }
  return (
    <div>
      {buttonSet.buttons.map((btn, index) => (
        <div key={index} style={{ marginBottom: "16px" }}>
          {/* アクションボタン */}
          <ActionButton
            action={btn.action}
            onClick={() => {}}
            team={""}
            isActive={false}
          />
          {/* アクションに紐づくラベルボタン群 */}
          <div style={{ marginTop: "8px" }}>
            {btn.labels.map((lbl, i) => (
              <LabelButton
                key={i}
                label={lbl}
                isActive={false}
                isDisabled={false}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ButtonSetComponent
