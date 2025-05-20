import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"
import Draggable from "react-draggable"

import TimelinePanel from "~components/TimelinePanel"

import {
  addLabel,
  exportActionsToCSV,
  getActions,
  loadActionsFromStorage,
  saveActionsToStorage,
  startAction,
  stopAction
} from "./lib/actionsManager"

export const config: PlasmoContentScript = {
  matches: ["*://*.youtube.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const MainContent: React.FC = () => {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  const [actions, setActions] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [teams, setTeams] = useState<string[]>([])
  const [timelineActions, setTimelineActions] = useState(getActions())

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await chrome.storage.local.get([
          "actions",
          "labels",
          "teams"
        ])
        if (result.actions) setActions(result.actions)
        if (result.labels) setLabels(result.labels)
        if (result.teams) setTeams(result.teams)
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.actions?.newValue) setActions(changes.actions.newValue)
        if (changes.labels?.newValue) setLabels(changes.labels.newValue)
        if (changes.teams?.newValue) setTeams(changes.teams.newValue)
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
      stopAction(team, action)
      setActiveActions((prev) => {
        const updated = new Set(prev)
        updated.delete(actionKey)
        return updated
      })
    } else {
      startAction(team, action)
      setActiveActions((prev) => new Set(prev).add(actionKey))
    }
    setTimelineActions(getActions())
  }

  const handleLabel = (label: string) => {
    for (const actionKey of activeActions) {
      const [team, action] = actionKey.split("_")
      addLabel(team, action, label)
    }
    setTimelineActions(getActions())
  }

  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
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
            cursor: "move",
            minWidth: "300px"
          }}>
          <h3>タグ付けパネル</h3>
          <div style={{ marginBottom: "20px" }}>
            {teams.map((team) => (
              <div key={team} style={{ marginBottom: "10px" }}>
                <h4>{team}</h4>
                {Object.keys(actions).map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionToggle(team, action)}
                    style={{
                      margin: "0 5px 5px 0",
                      padding: "5px 10px",
                      backgroundColor: activeActions.has(`${team}_${action}`)
                        ? "#dc3545"
                        : "#e9ecef",
                      color: activeActions.has(`${team}_${action}`)
                        ? "white"
                        : "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}>
                    {action}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div>
            <h4>ラベル</h4>
            <div style={{ marginBottom: "10px" }}>
              {Object.keys(labels).map((label) => (
                <button
                  key={label}
                  onClick={() => handleLabel(label)}
                  disabled={activeActions.size === 0}
                  style={{
                    margin: "0 5px 5px 0",
                    padding: "5px 10px",
                    backgroundColor: "#e9ecef",
                    border: "none",
                    borderRadius: "4px",
                    cursor: activeActions.size > 0 ? "pointer" : "not-allowed",
                    opacity: activeActions.size > 0 ? 1 : 0.5
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Draggable>
      <TimelinePanel actions={timelineActions} />
    </div>
  )
}

export default MainContent
