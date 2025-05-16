import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import Draggable from "react-draggable"

import {
  addLabel,
  exportActionsToCSV,
  loadActionsFromStorage,
  saveActionsToStorage,
  startAction,
  stopAction
} from "./lib/actionsManager"
import { loadHotkeysFromStorage } from "./lib/hotkeys"

export const config: PlasmoCSConfig = {
  matches: ["*://*.youtube.com/*"]
}

export default function Contents() {
  console.log("YouCoder content script loaded")
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  const [hotkeys, setHotkeys] = useState(loadHotkeysFromStorage())
  const [actions, setActions] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    // ページ読み込み時に保存されたアクションをロード
    loadActionsFromStorage()
  }, [])

  useEffect(() => {
    // ローカルストレージからアクションとラベルを読み込む
    const storedActions = localStorage.getItem("actions")
    const storedLabels = localStorage.getItem("labels")
    if (storedActions) {
      setActions(JSON.parse(storedActions))
    }
    if (storedLabels) {
      setLabels(JSON.parse(storedLabels))
    }
  }, [])

  const handleActionToggle = (team: string, action: string) => {
    const actionKey = `${team}_${action}`

    if (activeActions.has(actionKey)) {
      // アクションを停止
      stopAction(team, action)
      setActiveActions((prev) => {
        const updated = new Set(prev)
        updated.delete(actionKey)
        return updated
      })
    } else {
      // アクションを開始
      startAction(team, action)
      setActiveActions((prev) => new Set(prev).add(actionKey))
    }
  }

  const handleLabel = (team: string, action: string, label: string) => {
    addLabel(team, action, label)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // アクションホットキーの処理
      const actionKey = Object.entries(hotkeys.actions).find(
        ([, key]) => key === event.key
      )
      if (actionKey) {
        event.preventDefault() // YouTubeのデフォルト動作を無効化
        const [action] = actionKey
        const [team, actionName] = action.split("_")
        startAction(team, actionName)
      }

      // ラベルホットキーの処理
      const labelKey = Object.entries(hotkeys.labels).find(
        ([, key]) => key === event.key
      )
      if (labelKey) {
        event.preventDefault() // YouTubeのデフォルト動作を無効化
        const [label] = labelKey
        addLabel("Team A", "Shoot", label) // 固定値は適宜変更
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [hotkeys]) // hotkeysが変更された場合に再登録

  return (
    <Draggable>
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          cursor: "move" // ドラッグ可能であることを示すカーソル
        }}>
        <h3>Team A</h3>
        <button
          onClick={() => handleActionToggle("Team A", "Shoot")}
          style={{
            backgroundColor: activeActions.has("Team A_Shoot")
              ? "green"
              : "gray",
            color: "white",
            margin: "5px"
          }}>
          {activeActions.has("Team A_Shoot") ? "Stop Shoot" : "Start Shoot"}
        </button>
        <button
          onClick={() => handleActionToggle("Team A", "Pass")}
          style={{
            backgroundColor: activeActions.has("Team A_Pass")
              ? "green"
              : "gray",
            color: "white",
            margin: "5px"
          }}>
          {activeActions.has("Team A_Pass") ? "Stop Pass" : "Start Pass"}
        </button>
        <h3>Labels</h3>
        <button
          onClick={() => handleLabel("Team A", "Shoot", "Dribble")}
          style={{ margin: "5px" }}>
          Add Dribble to Shoot
        </button>
        <button
          onClick={() => handleLabel("Team A", "Pass", "Defense")}
          style={{ margin: "5px" }}>
          Add Defense to Pass
        </button>
        <h3>Actions</h3>
        <button onClick={saveActionsToStorage} style={{ margin: "5px" }}>
          Save Actions
        </button>
        <button onClick={exportActionsToCSV} style={{ margin: "5px" }}>
          Export to CSV
        </button>
        <h3>Loaded Actions</h3>
        <ul>
          {Object.keys(actions).map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
        <h3>Loaded Labels</h3>
        <ul>
          {Object.keys(labels).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </Draggable>
  )
}
