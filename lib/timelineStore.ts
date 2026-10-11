export const TIMELINE_MESSAGE_TYPE = "YOUCODER_TIMELINE" as const

export interface TimelineAction {
  id: string
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
      actionId: string
      end: number
    }
  | {
      type: "label"
      actionId: string
      label: string
    }
  | { type: "delete"; actionId: string }

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

  switch (operation.type) {
    case "start":
      return (
        isName(operation.team) &&
        isName(operation.action) &&
        isTimestamp(operation.start)
      )
    case "delete":
      return isName(operation.actionId)
    case "stop":
      return isName(operation.actionId) && isTimestamp(operation.end)
    case "label":
      return isName(operation.actionId) && isName(operation.label)
    default:
      return false
  }
}

// Only these fixed messages can cross the runtime boundary. Storage errors can
// contain implementation details and are deliberately not returned to pages.
class TimelineStoreError extends Error {}

type StoredTimelineAction = Omit<TimelineAction, "id"> & { id?: string }

const isStoredAction = (item: unknown): item is StoredTimelineAction =>
  isRecord(item) &&
  (!hasOwn(item, "id") || isName(item.id)) &&
  isName(item.team) &&
  isName(item.action) &&
  isTimestamp(item.start) &&
  (item.end === undefined || isTimestamp(item.end)) &&
  Array.isArray(item.labels) &&
  item.labels.every((label) => typeof label === "string")

const readStoredTimeline = (value: unknown): StoredTimelineAction[] => {
  const invalidData = () =>
    new TimelineStoreError(
      "Stored timeline data is invalid. Existing data was not changed."
    )
  // Validate the complete array before generating IDs or writing a migration.
  if (!Array.isArray(value)) throw invalidData()
  const ids = new Set<string>()
  const actions: StoredTimelineAction[] = []
  for (const item of value) {
    if (!isStoredAction(item)) throw invalidData()
    if (item.id !== undefined) {
      if (ids.has(item.id)) throw invalidData()
      ids.add(item.id)
    }
    actions.push({ ...item, labels: [...item.labels] })
  }
  return actions
}

const cloneTimeline = (actions: TimelineAction[]): TimelineAction[] =>
  actions.map((item) => ({ ...item, labels: [...item.labels] }))

/**
 * Create one instance in the service worker, shared by every tab. The queue
 * covers reads and writes together; per-video keys also avoid rewriting other
 * videos or the legacy timelines object. Importing this module does not start
 * a queue or touch browser APIs.
 */
export const createTimelineStore = (
  storage: TimelineStorage,
  createId: () => string = () => crypto.randomUUID()
) => {
  let queue: Promise<void> = Promise.resolve()

  const newActionId = (ids: Set<string>): string => {
    let id: string
    try {
      id = createId()
    } catch {
      throw new TimelineStoreError("Timeline action ID could not be created.")
    }
    if (!isName(id) || ids.has(id)) {
      throw new TimelineStoreError("Timeline action ID could not be created.")
    }
    ids.add(id)
    return id
  }

  const persist = async (videoId: string, actions: TimelineAction[]) => {
    try {
      // Never share mutable objects with an adapter or a later failed edit.
      await storage.set({
        [timelineStorageKey(videoId)]: cloneTimeline(actions)
      })
    } catch {
      throw new TimelineStoreError(
        "Timeline storage write failed. Your changes were not saved."
      )
    }
  }

  const readStorage = async (keys: string[]) => {
    let result: Record<string, unknown>
    try {
      result = await storage.get(keys)
    } catch {
      throw new TimelineStoreError("Timeline storage could not be read.")
    }
    if (!isRecord(result)) {
      throw new TimelineStoreError("Timeline storage could not be read.")
    }
    return result
  }

  const readLatest = async (videoId: string): Promise<TimelineAction[]> => {
    const key = timelineStorageKey(videoId)
    const result = await readStorage([key])
    let raw: unknown = []
    let needsMigration = false
    if (hasOwn(result, key)) {
      raw = result[key]
    } else {
      // Once migrated, avoid loading every other video's legacy records.
      const legacy = await readStorage(["timelines"])
      if (hasOwn(legacy, "timelines")) {
        if (!isRecord(legacy.timelines)) {
          throw new TimelineStoreError(
            "Stored timeline data is invalid. Existing data was not changed."
          )
        }
        if (hasOwn(legacy.timelines, videoId)) {
          raw = legacy.timelines[videoId]
          needsMigration = true
        }
      }
    }

    const stored = readStoredTimeline(raw)
    const ids = new Set(
      stored.flatMap((item) => (item.id === undefined ? [] : [item.id]))
    )
    const actions = stored.map((item): TimelineAction => {
      if (item.id !== undefined) return { ...item, id: item.id }
      needsMigration = true
      return { ...item, id: newActionId(ids) }
    })
    // IDs must be durable before any tab receives them. Keep the old timelines
    // object untouched, and retry a failed migration on the next request.
    if (needsMigration) await persist(videoId, actions)
    return actions
  }

  const apply = async (
    videoId: string,
    operation: TimelineOperation
  ): Promise<TimelineResult> => {
    const actions = await readLatest(videoId)
    if (operation.type === "read") return { actions, changed: false }

    let target: TimelineAction | undefined
    if (operation.type !== "start") {
      target = actions.find((item) => item.id === operation.actionId)
      if (
        !target ||
        (operation.type !== "delete" && target.end !== undefined)
      ) {
        // Timestamps can repeat after seeking. Only the displayed interval's
        // permanent ID can authorize an edit, never a replacement interval.
        throw new TimelineStoreError(
          "Timeline action changed. Refresh the timeline and try again."
        )
      }
    }
    let changed = false

    switch (operation.type) {
      case "start": {
        const active = actions.find(
          (item) =>
            item.team === operation.team &&
            item.action === operation.action &&
            item.end === undefined
        )
        if (!active) {
          actions.push({
            id: newActionId(new Set(actions.map((item) => item.id))),
            team: operation.team,
            action: operation.action,
            start: operation.start,
            labels: []
          })
          changed = true
        }
        break
      }
      case "stop":
        if (target) {
          if (operation.end < target.start) {
            throw new TimelineStoreError(
              "The end time cannot be before the action start time."
            )
          }
          target.end = operation.end
          changed = true
        }
        break
      case "label":
        if (target && !target.labels.includes(operation.label)) {
          target.labels.push(operation.label)
          changed = true
        }
        break
      case "delete": {
        const index = actions.findIndex(
          (item) => item.id === operation.actionId
        )
        if (index !== -1) {
          actions.splice(index, 1)
          changed = true
        }
        break
      }
    }

    if (changed) await persist(videoId, actions)
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
