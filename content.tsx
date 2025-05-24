import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"

import { TaggingPanel } from "~components/TaggingPanel"
import TimelinePanel from "~components/TimelinePanel"

import {
  addLabel,
  getActions,
  loadActionsFromStorage,
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
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())

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
    setActiveLabels((prev) => {
      const updated = new Set(prev)
      updated.add(label)
      setTimeout(() => {
        setActiveLabels((current) => {
          const next = new Set(current)
          next.delete(label)
          return next
        })
      }, 1000)
      return updated
    })
  }

  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
      <TaggingPanel
        teams={teams}
        actions={actions}
        labels={labels}
        activeActions={activeActions}
        activeLabels={activeLabels}
        onActionToggle={handleActionToggle}
        onLabelClick={handleLabel}
      />
      <TimelinePanel
        actions={timelineActions}
        onDelete={async () => {
          const result = await loadActionsFromStorage()
          setTimelineActions(getActions())
        }}
      />
    </div>
  )
}

export default MainContent
