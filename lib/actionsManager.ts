import { buildActionsCsv } from "./actionCsv"
import {
  TIMELINE_MESSAGE_TYPE,
  type TimelineAction as Action,
  type TimelineOperation,
  type TimelineResponse
} from "./timelineStore"

let actions: Action[] = []
let activeVideoId: string | null = null
let requestSequence = 0
let teams: string[] = []

export const resetState = () => {
  actions = []
  activeVideoId = null
  requestSequence++
  teams = []
}

export const addTeam = async (teamName: string) => {
  const updated = teams.includes(teamName) ? teams : [...teams, teamName]
  await chrome.storage.local.set({ teams: updated })
  teams = updated
}
export const removeTeam = async (teamName: string) => {
  const updated = teams.filter((team) => team !== teamName)
  await chrome.storage.local.set({ teams: updated })
  teams = updated
}
export const getTeams = () => [...teams]
export const loadActionsFromStorage = async () => {
  const result = await chrome.storage.local.get(["actions", "labels", "teams"])
  teams = result.teams || []
  return result
}

const getYoutubeCurrentTime = (): number => {
  const video = document.querySelector("video") as HTMLVideoElement | null
  if (
    !video ||
    video.error ||
    video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
    video.readyState < HTMLMediaElement.HAVE_METADATA ||
    !Number.isFinite(video.currentTime) ||
    video.currentTime < 0
  ) {
    throw new Error(
      "動画の再生位置を取得できません。動画を読み込んでから再試行してください。"
    )
  }
  return Math.floor(video.currentTime * 1000)
}

export const getYoutubeVideoId = (): string | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const videoId = urlParams.get("v")
    if (!videoId) {
      console.warn(
        "[YouCoder] 動画IDが取得できません - YouTube動画ページではない可能性があります"
      )
    }
    return videoId // YouTube動画のIDを取得します。
  } catch (error) {
    console.error("[YouCoder] 動画ID取得エラー:", error)
    return null
  }
}

const requestTimeline = async (
  videoId: string,
  operation: TimelineOperation
) => {
  const sequence = ++requestSequence
  if (activeVideoId !== videoId) {
    actions = []
    activeVideoId = videoId
  }
  const response: TimelineResponse = await chrome.runtime.sendMessage({
    type: TIMELINE_MESSAGE_TYPE,
    videoId,
    operation
  })
  if (!response?.ok) {
    throw new Error(
      "記録を保存・読み込みできませんでした。拡張機能を再読み込みして再試行してください。"
    )
  }
  // Navigation and a later request must never be overwritten by an older reply.
  if (getYoutubeVideoId() === videoId && sequence === requestSequence) {
    activeVideoId = videoId
    actions = response.actions
  }
  return response
}
const currentVideoId = () => {
  const videoId = getYoutubeVideoId()
  if (!videoId) throw new Error("YouTubeの動画ページを開いてください。")
  return videoId
}
export const startAction = async (team: string, action: string) => {
  return requestTimeline(currentVideoId(), {
    type: "start",
    team,
    action,
    start: getYoutubeCurrentTime()
  })
}
export const stopAction = async (actionId: string) => {
  return requestTimeline(currentVideoId(), {
    type: "stop",
    actionId,
    end: getYoutubeCurrentTime()
  })
}
export const addLabel = async (actionId: string, label: string) => {
  return requestTimeline(currentVideoId(), { type: "label", actionId, label })
}
export const getActions = (): Action[] =>
  getYoutubeVideoId() === activeVideoId
    ? actions.map((action) => ({ ...action, labels: [...action.labels] }))
    : []

// Mutations are durably saved before acknowledgement; this never writes a stale tab snapshot.
export const saveTimelineForVideo = async (
  videoId: string | null
): Promise<boolean> => {
  if (!videoId || videoId !== getYoutubeVideoId()) return false
  await requestTimeline(videoId, { type: "read" })
  return true
}
export const loadTimelineForVideo = async (
  videoId: string | null
): Promise<Action[]> => {
  if (!videoId) {
    actions = []
    activeVideoId = null
    requestSequence++
    return []
  }
  return (await requestTimeline(videoId, { type: "read" })).actions
}
export const deleteAction = async (actionId: string): Promise<boolean> => {
  return (await requestTimeline(currentVideoId(), { type: "delete", actionId }))
    .changed
}
export const exportActionsToCSV = (actionsList: Action[] = getActions()) => {
  const blob = new Blob([buildActionsCsv(actionsList)], {
    type: "text/csv;charset=utf-8"
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `actions_${new Date().toISOString().split("T")[0]}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
