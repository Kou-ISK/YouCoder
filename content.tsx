import cssText from "data-text:~/styles/style.css"
import type { PlasmoContentScript } from "plasmo"
import React, { useEffect, useState } from "react"

import { TaggingPanel } from "~components/TaggingPanel"
import TimelinePanel from "~components/TimelinePanel"

import {
  addLabel,
  getActions,
  loadActionsFromStorage,
  saveTimelineForVideo,
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

const getYoutubeVideoId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("v")
}

const MainContent: React.FC = () => {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  const [isVideoPage, setIsVideoPage] = useState<boolean>(
    window.location.pathname.startsWith("/watch")
  )
  const [actions, setActions] = useState<Record<string, string>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [teams, setTeams] = useState<string[]>([])
  const [timelineActions, setTimelineActions] = useState(getActions())
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())
  const [showExtension, setShowExtension] = useState<boolean>(true)

  useEffect(() => {
    // Fallback polling mechanism for SPA navigation changes
    const timer = setInterval(() => {
      setIsVideoPage(!!getYoutubeVideoId())
    }, 500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleNavigateFinish = () => {
      setIsVideoPage(!!getYoutubeVideoId())
    }
    document.addEventListener("yt-navigate-finish", handleNavigateFinish)
    return () => {
      document.removeEventListener("yt-navigate-finish", handleNavigateFinish)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const videoId = getYoutubeVideoId()
        const result = await chrome.storage.local.get([
          "actions",
          "labels",
          "teams",
          "timelines"
        ])
        if (videoId && result.timelines) {
          setTimelineActions(result.timelines[videoId] || [])
        }
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
        if (changes.showExtension?.newValue !== undefined)
          setShowExtension(changes.showExtension.newValue)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const data = await chrome.storage.local.get(["showExtension"])
        setShowExtension(
          data.showExtension !== undefined ? data.showExtension : true
        )
      } catch (error) {
        console.error("Failed to load showExtension setting:", error)
      }
    }
    loadSetting()
  }, [])

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "EXTENSION_VISIBILITY_UPDATED") {
        chrome.storage.local.get(["showExtension"]).then((data: any) => {
          setShowExtension(
            data.showExtension !== undefined ? data.showExtension : true
          )
        })
      }
    }
    const runtime = (chrome as any).runtime
    runtime.onMessage.addListener(handleMessage)
    return () => {
      runtime.onMessage.removeListener(handleMessage)
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

  const handleSaveTimeline = async () => {
    const videoId = getYoutubeVideoId()
    if (videoId) {
      await saveTimelineForVideo(videoId)
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
      {isVideoPage && showExtension && (
        <>
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
            onSave={handleSaveTimeline}
          />
        </>
      )}
    </div>
  )
}

export default MainContent
