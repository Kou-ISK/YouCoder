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

// YouTubeの動画IDを取得する関数。URLのクエリパラメータから"v"を抽出します。
const getYoutubeVideoId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("v")
}

const MainContent: React.FC = () => {
  // 現在アクティブなアクションのセット。
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())

  // 現在のページが動画ページかどうかを判定。
  const [isVideoPage, setIsVideoPage] = useState<boolean>(
    window.location.pathname.startsWith("/watch")
  )

  // チーム名のリスト。
  const [teams, setTeams] = useState<string[]>([])

  // ボタンセットのリスト。
  const [buttonSets, setButtonSets] = useState<any[]>([])

  // 選択されたボタンセット。
  const [selectedButtonSet, setSelectedButtonSet] = useState<string | null>(
    null
  )

  // タイムラインに関連付けられたアクション。
  const [timelineActions, setTimelineActions] = useState(getActions())

  // 現在アクティブなラベルのセット。
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set())

  // 拡張機能の表示状態。
  const [showExtension, setShowExtension] = useState<boolean>(true)

  useEffect(() => {
    // SPAナビゲーションの変更を監視するためのポーリングメカニズム。
    const timer = setInterval(() => {
      setIsVideoPage(!!getYoutubeVideoId())
    }, 500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // YouTubeのナビゲーションイベントを監視します。
    const handleNavigateFinish = () => {
      setIsVideoPage(!!getYoutubeVideoId())
    }
    document.addEventListener("yt-navigate-finish", handleNavigateFinish)
    return () => {
      document.removeEventListener("yt-navigate-finish", handleNavigateFinish)
    }
  }, [])

  useEffect(() => {
    // ローカルストレージからデータを読み込みます。
    const loadData = async () => {
      try {
        const videoId = getYoutubeVideoId()
        const result = await chrome.storage.local.get([
          "teams",
          "buttonSets",
          "timelines",
          "selectedButtonSet"
        ])
        if (videoId && result.timelines) {
          setTimelineActions(result.timelines[videoId] || [])
        }
        if (result.teams) setTeams(result.teams)
        if (result.buttonSets) {
          setButtonSets(result.buttonSets)
        }
        if (result.selectedButtonSet) {
          setSelectedButtonSet(result.selectedButtonSet)
        } else if (result.buttonSets && result.buttonSets.length > 0) {
          setSelectedButtonSet(result.buttonSets[0].setName)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    // ストレージの変更を監視します。
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local") {
        if (changes.teams?.newValue) setTeams(changes.teams.newValue)
        if (changes.buttonSets?.newValue)
          setButtonSets(changes.buttonSets.newValue)
        if (changes.selectedButtonSet?.newValue)
          setSelectedButtonSet(changes.selectedButtonSet.newValue)
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
    // 拡張機能の表示設定を読み込みます。
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
    // 拡張機能の可視性に関するメッセージを処理します。
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

  // 新たに選択中のアクションを管理し、ラベル表示を絞り込む
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())

  const handleActionSelect = (team: string, action: string) => {
    // アクションの選択状態を切り替えます。
    const key = `${team}_${action}`
    setSelectedActions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleLabel = (label: string) => {
    // ラベルをアクションに追加します。
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
    // タイムラインを保存します。
    const videoId = getYoutubeVideoId()
    if (videoId) {
      await saveTimelineForVideo(videoId)
    }
  }

  // 選択中のボタンセットに基づくアクション・ラベルを抽出
  const currentSet = buttonSets.find((set) => set.setName === selectedButtonSet)

  const actions =
    currentSet?.buttons.reduce(
      (acc, btn) => {
        acc[btn.action] = btn.action
        return acc
      },
      {} as Record<string, string>
    ) || {}

  const labels =
    currentSet?.buttons.reduce(
      (acc, btn) => {
        btn.labels.forEach((label) => {
          acc[label] = label
        })
        return acc
      },
      {} as Record<string, string>
    ) || {}

  const filteredLabels = Object.fromEntries(
    buttonSets
      .find((set) => set.setName === selectedButtonSet)
      ?.buttons.filter((btn) => selectedActions.has(btn.action))
      .flatMap((btn) => btn.labels.map((label) => [label, label])) || []
  )

  console.log("Filtered Labels:", filteredLabels)

  const handleActionToggle = (team: string, action: string) => {
    // アクションの開始・停止を切り替えます。
    const actionKey = `${team}_${action}`

    setActiveActions((prev) => {
      const updated = new Set(prev)
      if (updated.has(actionKey)) {
        stopAction(team, action)
        updated.delete(actionKey)
      } else {
        startAction(team, action)
        updated.add(actionKey)
      }
      console.log("Updated activeActions:", Array.from(updated))
      return updated
    })

    setSelectedActions((prev) => {
      const updated = new Set(prev)
      if (updated.has(action)) {
        updated.delete(action)
      } else {
        updated.add(action)
      }
      console.log("Updated selectedActions:", Array.from(updated))
      return updated
    })

    setTimelineActions(getActions())
  }

  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
      {isVideoPage && showExtension && (
        <>
          <TaggingPanel
            teams={teams}
            actions={actions}
            labels={filteredLabels}
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
