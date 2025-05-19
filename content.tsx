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
  const [timelineActions, setTimelineActions] = useState(getActions())
  const [newAction, setNewAction] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newTeam, setNewTeam] = useState("")
  const [teams, setTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")

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
      } finally {
        setIsLoading(false)
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
    // アクティブなアクションがある場合のみラベルを追加
    for (const actionKey of activeActions) {
      const [team, action] = actionKey.split("_")
      addLabel(team, action, label)
    }
    setTimelineActions(getActions())
  }

  const handleAddTeam = () => {
    if (newTeam.trim()) {
      const updatedTeams = [...teams, newTeam]
      setTeams(updatedTeams)
      chrome.storage.local.set({ teams: updatedTeams })
      setNewTeam("")
    }
  }

  const handleAddAction = () => {
    if (newAction.trim()) {
      setActions((prev) => ({
        ...prev,
        [newAction]: newAction
      }))
      chrome.storage.local.set({
        actions: { ...actions, [newAction]: newAction }
      })
      setNewAction("")
    }
  }

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      setLabels((prev) => ({
        ...prev,
        [newLabel]: newLabel
      }))
      chrome.storage.local.set({ labels: { ...labels, [newLabel]: newLabel } })
      setNewLabel("")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
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
          <h3>チーム設定</h3>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="新しいチーム名"
              style={{ marginRight: "5px", padding: "5px" }}
            />
            <button onClick={handleAddTeam}>チーム追加</button>
          </div>
          <div style={{ marginBottom: "20px" }}>
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                style={{
                  margin: "0 5px 5px 0",
                  padding: "5px 10px",
                  backgroundColor:
                    selectedTeam === team ? "#007bff" : "#e9ecef",
                  color: selectedTeam === team ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                {team}
              </button>
            ))}
          </div>

          <h3>アクション追加</h3>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="新しいアクション"
              style={{ marginRight: "5px", padding: "5px" }}
            />
            <button onClick={handleAddAction}>アクション追加</button>
          </div>
          <div style={{ marginBottom: "20px" }}>
            {Object.keys(actions).map((action) => (
              <button
                key={action}
                onClick={() =>
                  selectedTeam && handleActionToggle(selectedTeam, action)
                }
                style={{
                  margin: "0 5px 5px 0",
                  padding: "5px 10px",
                  backgroundColor:
                    selectedTeam &&
                    activeActions.has(`${selectedTeam}_${action}`)
                      ? "#dc3545"
                      : "#e9ecef",
                  color:
                    selectedTeam &&
                    activeActions.has(`${selectedTeam}_${action}`)
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

          <h3>ラベル追加</h3>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="新しいラベル"
              style={{ marginRight: "5px", padding: "5px" }}
            />
            <button onClick={handleAddLabel}>ラベル追加</button>
          </div>
          <div style={{ marginBottom: "10px" }}>
            {Object.keys(labels).map((label) => (
              <button
                key={label}
                onClick={() => handleLabel(label)}
                style={{
                  margin: "0 5px 5px 0",
                  padding: "5px 10px",
                  backgroundColor: "#e9ecef",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Draggable>
      <TimelinePanel actions={timelineActions} />
    </>
  )
}

export default Content
