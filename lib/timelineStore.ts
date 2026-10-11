export const TIMELINE_MESSAGE_TYPE = "YOUCODER_TIMELINE" as const

export interface TimelineAction {
  team: string
  action: string
  start: number
  end?: number
  labels: string[]
}

export type TimelineOperation =
  | { type: "read" }
  | { type: "start"; team: string; action: string; start: number }
  | {
      type: "stop"
      team: string
      action: string
      end: number
      expectedStart?: number
    }
  | {
      type: "label"
      team: string
      action: string
      label: string
      expectedStart?: number
    }
  | { type: "delete"; team: string; action: string; start: number }

export interface TimelineRequest {
  type: typeof TIMELINE_MESSAGE_TYPE
  videoId: string
  operation: TimelineOperation
}

export interface TimelineResult {
  actions: TimelineAction[]
  changed: boolean
}

export type TimelineResponse =
  | ({ ok: true } & TimelineResult)
  | { ok: false; error: string }

export interface TimelineStorage {
  get(keys: string[]): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

export interface TimelineSender {
  id?: string
  url?: string
  tab?: { url?: string }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key)

const isName = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const isTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0

export const isTimelineVideoId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]+$/.test(value)

export const timelineStorageKey = (videoId: string) =>
  `youCoder.timeline.${videoId}`

export const isTimelineRequest = (value: unknown): value is TimelineRequest => {
  if (
    !isRecord(value) ||
    value.type !== TIMELINE_MESSAGE_TYPE ||
    !isTimelineVideoId(value.videoId) ||
    !isRecord(value.operation)
  ) {
    return false
  }

  const operation = value.operation
  if (operation.type === "read") return true
  if (!isName(operation.team) || !isName(operation.action)) return false
  if (
    (operation.type === "stop" || operation.type === "label") &&
    hasOwn(operation, "expectedStart") &&
    !isTimestamp(operation.expectedStart)
  ) {
    return false
  }

  switch (operation.type) {
    case "start":
    case "delete":
      return isTimestamp(operation.start)
    case "stop":
      return isTimestamp(operation.end)
    case "label":
      return isName(operation.label)
    default:
      return false
  }
}

// Only these fixed messages can cross the runtime boundary. Storage errors can
// contain implementation details and are deliberately not returned to pages.
class TimelineStoreError extends Error {}

const cloneTimeline = (value: unknown): TimelineAction[] => {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isName(item.team) &&
        isName(item.action) &&
        isTimestamp(item.start) &&
        (item.end === undefined || isTimestamp(item.end)) &&
        Array.isArray(item.labels) &&
        item.labels.every((label) => typeof label === "string")
    )
  ) {
    // Never replace unreadable saved data with an empty timeline.
    throw new TimelineStoreError(
      "Stored timeline data is invalid. Existing data was not changed."
    )
  }

  return value.map((item) => ({ ...item, labels: [...item.labels] }))
}

/**
 * Create one instance in the service worker, shared by every tab. The queue
 * covers reads and writes together; per-video keys also avoid rewriting other
 * videos or the legacy timelines object. Importing this module does not start
 * a queue or touch browser APIs.
 */
export const createTimelineStore = (storage: TimelineStorage) => {
  let queue: Promise<void> = Promise.resolve()

  const readLatest = async (videoId: string): Promise<TimelineAction[]> => {
    const key = timelineStorageKey(videoId)
    let result: Record<string, unknown>
    try {
      result = await storage.get([key, "timelines"])
    } catch {
      throw new TimelineStoreError("Timeline storage could not be read.")
    }
    if (!isRecord(result)) {
      throw new TimelineStoreError("Timeline storage could not be read.")
    }

    if (hasOwn(result, key)) return cloneTimeline(result[key])

    if (hasOwn(result, "timelines")) {
      if (!isRecord(result.timelines)) {
        throw new TimelineStoreError(
          "Stored timeline data is invalid. Existing data was not changed."
        )
      }
      if (hasOwn(result.timelines, videoId)) {
        return cloneTimeline(result.timelines[videoId])
      }
    }
    return []
  }

  const apply = async (
    videoId: string,
    operation: TimelineOperation
  ): Promise<TimelineResult> => {
    const actions = await readLatest(videoId)
    if (operation.type === "read") return { actions, changed: false }

    const active = actions.find(
      (item) =>
        item.team === operation.team &&
        item.action === operation.action &&
        item.end === undefined
    )
    if (
      (operation.type === "stop" || operation.type === "label") &&
      operation.expectedStart !== undefined &&
      active?.start !== operation.expectedStart
    ) {
      // The displayed interval may have been stopped and restarted by another
      // tab or an earlier queued command. Do not apply stale edits to it.
      throw new TimelineStoreError(
        "Timeline action changed. Refresh the timeline and try again."
      )
    }
    let changed = false

    switch (operation.type) {
      case "start":
        if (!active) {
          actions.push({
            team: operation.team,
            action: operation.action,
            start: operation.start,
            labels: []
          })
          changed = true
        }
        break
      case "stop":
        if (active) {
          if (operation.end < active.start) {
            throw new TimelineStoreError(
              "The end time cannot be before the action start time."
            )
          }
          active.end = operation.end
          changed = true
        }
        break
      case "label":
        if (active && !active.labels.includes(operation.label)) {
          active.labels.push(operation.label)
          changed = true
        }
        break
      case "delete": {
        const index = actions.findIndex(
          (item) =>
            item.team === operation.team &&
            item.action === operation.action &&
            item.start === operation.start
        )
        if (index !== -1) {
          actions.splice(index, 1)
          changed = true
        }
        break
      }
    }

    if (changed) {
      try {
        await storage.set({ [timelineStorageKey(videoId)]: actions })
      } catch {
        // Do not return the modified copy, mutate saved objects, or claim a
        // page/session cache is durable when Chrome rejects persistence.
        throw new TimelineStoreError(
          "Timeline storage write failed. Your changes were not saved."
        )
      }
    }
    return { actions: cloneTimeline(actions), changed }
  }

  const execute = (
    videoId: string,
    operation: TimelineOperation
  ): Promise<TimelineResult> => {
    if (
      !isTimelineRequest({ type: TIMELINE_MESSAGE_TYPE, videoId, operation })
    ) {
      return Promise.reject(new TimelineStoreError("Invalid timeline request."))
    }

    // Capture the command now so callers cannot change it while it is queued.
    const capturedOperation = { ...operation }
    const result = queue.then(() => apply(videoId, capturedOperation))
    // A failed request must not poison later requests in the shared queue.
    queue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  return { execute }
}

const isYouTubeUrl = (value: unknown) => {
  if (typeof value !== "string") return false
  try {
    return new URL(value).origin === "https://www.youtube.com"
  } catch {
    return false
  }
}

/** Keep Chrome's response channel open until the durable write has settled. */
export const createTimelineMessageListener = (
  store: ReturnType<typeof createTimelineStore>,
  extensionId: string
) => {
  return (
    message: unknown,
    sender: TimelineSender,
    sendResponse: (response: TimelineResponse) => void
  ): boolean => {
    if (!isRecord(message) || message.type !== TIMELINE_MESSAGE_TYPE) {
      return false
    }
    if (
      !extensionId ||
      sender.id !== extensionId ||
      !isYouTubeUrl(sender.tab?.url) ||
      (sender.url !== undefined && !isYouTubeUrl(sender.url))
    ) {
      sendResponse({ ok: false, error: "Unauthorized timeline request." })
      return false
    }
    if (!isTimelineRequest(message)) {
      sendResponse({ ok: false, error: "Invalid timeline request." })
      return false
    }

    void store.execute(message.videoId, message.operation).then(
      (result) => sendResponse({ ok: true, ...result }),
      (error: unknown) =>
        sendResponse({
          ok: false,
          error:
            error instanceof TimelineStoreError
              ? error.message
              : "Timeline request failed."
        })
    )
    return true
  }
}
