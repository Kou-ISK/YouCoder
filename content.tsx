import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"

import { CodeButton } from "~codeButton"
import type { Button } from "~types/Button"

export const config: PlasmoCSConfig = {
  matches: ["*://*.youtube.com/*"]
}

function Contents() {
  console.log("YouCoder content script loaded")
  const [buttons, setButtons] = useState<Button[]>([
    {
      type: "action",
      name: "Green Button",
      color: "#0f0"
    },
    {
      type: "label",
      name: "Label",
      color: "#f00"
    }
  ])

  return (
    <div
      style={{
        padding: 16
      }}>
      <h2>YouCoder</h2>
      {buttons.map((button, index) => {
        return CodeButton(button)
      })}
    </div>
  )
}

export default Contents
