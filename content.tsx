import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"
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

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

export const getRootContainer = () => {
  const container = document.createElement("div")
  container.id = "youcoder-root"
  document.body.appendChild(container)
  return container
}

const Content = () => {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  const [hotkeys, setHotkeys] = useState(loadHotkeysFromStorage())
  const [actions, setActions] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Content script mounted") // デバッグ用
    const loadData = async () => {
      try {
        console.log("Loading data from storage") // デバッグ用
        const result = await chrome.storage.local.get(["actions", "labels"])
        console.log("Loaded data:", result) // デバッグ用
        if (result.actions) {
          setActions(result.actions)
        }
        if (result.labels) {
          setLabels(result.labels)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      console.log("Storage changed:", changes) // デバッグ用
      if (areaName === "local") {
        if (changes.actions?.newValue) {
          setActions(changes.actions.newValue)
        }
        if (changes.labels?.newValue) {
          setLabels(changes.labels.newValue)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
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

  if (isLoading) {
    return <div>Loading...</div>
  }

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
          cursor: "move"
        }}>
        <h3>Actions</h3>
        {Object.keys(actions).map((action) => (
          <button
            key={action}
            onClick={() => handleActionToggle("Team A", action)}
            style={{
              backgroundColor: activeActions.has(`Team A_${action}`)
                ? "green"
                : "gray",
              color: "white",
              margin: "5px"
            }}>
            {activeActions.has(`Team A_${action}`)
              ? `Stop ${action}`
              : `Start ${action}`}
          </button>
        ))}

        <h3>Labels</h3>
        {Object.keys(labels).map((label) => (
          <button
            key={label}
            onClick={() => handleLabel("Team A", "Shoot", label)}
            style={{ margin: "5px" }}>
            Add {label} to Shoot
          </button>
        ))}

        <button onClick={saveActionsToStorage} style={{ margin: "5px" }}>
          Save Actions
        </button>
        <button onClick={exportActionsToCSV} style={{ margin: "5px" }}>
          Export to CSV
        </button>
      </div>
    </Draggable>
  )
}

export default Content
