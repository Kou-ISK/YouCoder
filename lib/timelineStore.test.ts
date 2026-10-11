import {
  createTimelineMessageListener,
  createTimelineStore,
  isTimelineRequest,
  TIMELINE_MESSAGE_TYPE,
  timelineStorageKey,
  type TimelineAction,
  type TimelineOperation,
  type TimelineResponse,
  type TimelineStorage
} from "./timelineStore"

const action = (overrides: Partial<TimelineAction> = {}): TimelineAction => ({
  team: "Team A",
  action: "Pass",
  start: 0,
  labels: [],
  ...overrides
})

const start = (
  name = "Pass",
  time = 0
): Extract<TimelineOperation, { type: "start" }> => ({
  type: "start",
  team: "Team A",
  action: name,
  start: time
})

const memoryStorage = (initial: Record<string, unknown> = {}) => {
  const data = { ...initial }
  // Deliberately return references. The store must copy before editing data,
  // even if a storage adapter itself does not provide Chrome's cloned values.
  const storage = {
    get: jest.fn(async (keys: string[]) => {
      const result: Record<string, unknown> = {}
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = data[key]
        }
      }
      return result
    }),
    set: jest.fn(async (items: Record<string, unknown>) => {
      Object.assign(data, items)
    })
  }
  return { data, storage, store: createTimelineStore(storage) }
}

const deferred = () => {
  let resolve: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe("serialized timeline persistence", () => {
  test("serializes same-video operations from separate callers", async () => {
    const { data, storage, store } = memoryStorage()
    const saving = deferred()
    const releaseSave = deferred()
    storage.set.mockImplementationOnce(async (items) => {
      saving.resolve()
      await releaseSave.promise
      Object.assign(data, items)
    })

    const firstTab = store.execute("video-a", start("Pass"))
    await saving.promise
    const secondTab = store.execute("video-a", start("Shot", 10))
    const followingRead = store.execute("video-a", { type: "read" })
    expect(storage.get).toHaveBeenCalledTimes(1)
    expect(data[timelineStorageKey("video-a")]).toBeUndefined()

    releaseSave.resolve()
    await expect(firstTab).resolves.toMatchObject({ changed: true })
    await expect(secondTab).resolves.toEqual({
      changed: true,
      actions: [action(), action({ action: "Shot", start: 10 })]
    })
    await expect(followingRead).resolves.toEqual({
      changed: false,
      actions: [action(), action({ action: "Shot", start: 10 })]
    })
    expect(data[timelineStorageKey("video-a")]).toHaveLength(2)
  })

  test("concurrent different-video commands preserve both videos and legacy data", async () => {
    const legacy = { existing: [action({ action: "Legacy" })] }
    const { data, storage, store } = memoryStorage({ timelines: legacy })
    await Promise.all([
      store.execute("video-a", start("Pass")),
      store.execute("video-b", start("Shot")),
      store.execute("video-a", start("Run")),
      store.execute("video-b", start("Save"))
    ])

    expect(data[timelineStorageKey("video-a")]).toEqual([
      action(),
      action({ action: "Run" })
    ])
    expect(data[timelineStorageKey("video-b")]).toEqual([
      action({ action: "Shot" }),
      action({ action: "Save" })
    ])
    expect(data.timelines).toBe(legacy)
    for (const [items] of storage.set.mock.calls) {
      expect(Object.keys(items)).toHaveLength(1)
      expect(items).not.toHaveProperty("timelines")
    }
  })

  test("reads latest storage instead of reusing a stale in-memory snapshot", async () => {
    const { data, store } = memoryStorage()
    await store.execute("video", start())
    data[timelineStorageKey("video")] = [action({ action: "External change" })]
    const result = await store.execute("video", start("Shot"))
    expect(result.actions.map((item) => item.action)).toEqual([
      "External change",
      "Shot"
    ])
  })

  test("reads legacy storage without a write and migrates only on an edit", async () => {
    const original = action({ labels: ["Original"] })
    const legacy = { "legacy-video": [original], other: [action()] }
    const { data, storage, store } = memoryStorage({ timelines: legacy })

    const read = await store.execute("legacy-video", { type: "read" })
    expect(read).toEqual({ actions: [original], changed: false })
    expect(storage.set).not.toHaveBeenCalled()
    read.actions[0].labels.push("Only the returned copy")

    await store.execute("legacy-video", {
      type: "label",
      team: "Team A",
      action: "Pass",
      label: "New label"
    })
    expect(data[timelineStorageKey("legacy-video")]).toEqual([
      action({ labels: ["Original", "New label"] })
    ])
    expect(legacy["legacy-video"]).toEqual([action({ labels: ["Original"] })])
    expect(data.timelines).toBe(legacy)
  })

  test("an empty per-video timeline takes precedence over undeleted legacy data", async () => {
    const { storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [],
      timelines: { video: [action()] }
    })
    await expect(store.execute("video", { type: "read" })).resolves.toEqual({
      actions: [],
      changed: false
    })
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("legacy lookup ignores inherited keys", async () => {
    const { storage, store } = memoryStorage({ timelines: {} })
    await expect(store.execute("__proto__", { type: "read" })).resolves.toEqual(
      { actions: [], changed: false }
    )
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("treats end zero as completed and does not label or stop it again", async () => {
    const { store } = memoryStorage()
    await store.execute("video", start())
    await expect(
      store.execute("video", {
        type: "stop",
        team: "Team A",
        action: "Pass",
        end: 0
      })
    ).resolves.toEqual({ actions: [action({ end: 0 })], changed: true })

    for (const operation of [
      { type: "stop", team: "Team A", action: "Pass", end: 100 },
      { type: "label", team: "Team A", action: "Pass", label: "Late" }
    ] as TimelineOperation[]) {
      await expect(store.execute("video", operation)).resolves.toEqual({
        actions: [action({ end: 0 })],
        changed: false
      })
    }
    await expect(store.execute("video", start("Pass", 100))).resolves.toEqual({
      actions: [action({ end: 0 }), action({ start: 100 })],
      changed: true
    })
  })

  test("does not create duplicate simultaneous active actions", async () => {
    const { store, storage } = memoryStorage()
    const results = await Promise.all([
      store.execute("video", start()),
      store.execute("video", start())
    ])
    expect(results.map((result) => result.changed)).toEqual([true, false])
    expect(results[1].actions).toEqual([action()])
    expect(storage.set).toHaveBeenCalledTimes(1)
  })

  test("rejects a stop after seeking backward without modifying the interval", async () => {
    const original = action({ start: 100 })
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [original]
    })
    await expect(
      store.execute("video", {
        type: "stop",
        team: "Team A",
        action: "Pass",
        end: 50,
        expectedStart: 100
      })
    ).rejects.toThrow("end time cannot be before the action start time")
    expect(storage.set).not.toHaveBeenCalled()
    expect(original.end).toBeUndefined()
    expect(data[timelineStorageKey("video")]).toEqual([action({ start: 100 })])
  })

  test("labels the matching active action and deletes only the exact target", async () => {
    const { data, store } = memoryStorage({
      [timelineStorageKey("video")]: [
        action({ start: 0, end: 5 }),
        action({ start: 10 }),
        action({ team: "Team B", start: 10 })
      ]
    })
    await store.execute("video", {
      type: "label",
      team: "Team A",
      action: "Pass",
      label: "Result - good"
    })
    await store.execute("video", {
      type: "delete",
      team: "Team A",
      action: "Pass",
      start: 0
    })
    expect(data[timelineStorageKey("video")]).toEqual([
      action({ start: 10, labels: ["Result - good"] }),
      action({ team: "Team B", start: 10 })
    ])
  })

  test.each<TimelineOperation>([
    {
      type: "stop",
      team: "Team A",
      action: "Pass",
      end: 30,
      expectedStart: 0
    },
    {
      type: "label",
      team: "Team A",
      action: "Pass",
      label: "Stale label",
      expectedStart: 0
    }
  ])(
    "rejects a queued stale $type after the interval restarts",
    async (stale) => {
      const { data, storage, store } = memoryStorage({
        [timelineStorageKey("video")]: [action()]
      })
      const stop = store.execute("video", {
        type: "stop",
        team: "Team A",
        action: "Pass",
        end: 10,
        expectedStart: 0
      })
      const restart = store.execute("video", start("Pass", 20))
      const obsoleteEdit = store.execute("video", stale)
      await expect(obsoleteEdit).rejects.toThrow("Timeline action changed")
      await Promise.all([stop, restart])
      expect(data[timelineStorageKey("video")]).toEqual([
        action({ end: 10 }),
        action({ start: 20 })
      ])
      expect(storage.set).toHaveBeenCalledTimes(2)
    }
  )

  test("rejects an expected interval that has already stopped", async () => {
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [action({ end: 0 })]
    })
    await expect(
      store.execute("video", {
        type: "label",
        team: "Team A",
        action: "Pass",
        label: "Late label",
        expectedStart: 0
      })
    ).rejects.toThrow("Timeline action changed")
    expect(storage.set).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toEqual([action({ end: 0 })])
  })

  test("allows zero expectedStart and deduplicates repeated label retries", async () => {
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [action()]
    })
    const label: TimelineOperation = {
      type: "label",
      team: "Team A",
      action: "Pass",
      label: "Result - good",
      expectedStart: 0
    }
    const results = await Promise.all([
      store.execute("video", label),
      store.execute("video", label)
    ])
    expect(results.map((result) => result.changed)).toEqual([true, false])
    expect(data[timelineStorageKey("video")]).toEqual([
      action({ labels: ["Result - good"] })
    ])
    expect(storage.set).toHaveBeenCalledTimes(1)
  })

  test.each<TimelineOperation>([
    { type: "stop", team: "Team A", action: "Missing", end: 5 },
    { type: "label", team: "Team A", action: "Missing", label: "Good" },
    { type: "delete", team: "Team A", action: "Missing", start: 0 }
  ])("a missing $type target is a no-op", async (operation) => {
    const { storage, store } = memoryStorage()
    await expect(store.execute("video", operation)).resolves.toEqual({
      actions: [],
      changed: false
    })
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("captures a queued operation before callers can change it", async () => {
    const { store } = memoryStorage()
    const operation = start()
    const pending = store.execute("video", operation)
    operation.action = "Changed after enqueue"
    await expect(pending).resolves.toEqual({
      actions: [action()],
      changed: true
    })
  })

  test("returned results do not provide a reference to persisted data", async () => {
    const { data, store } = memoryStorage()
    const result = await store.execute("video", start())
    result.actions[0].labels.push("Not saved")
    result.actions.push(action({ action: "Not saved" }))
    expect(data[timelineStorageKey("video")]).toEqual([action()])
  })

  test("failed writes reject without mutating saved data and the queue recovers", async () => {
    const original = action({ labels: ["Saved"] })
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [original]
    })
    storage.set.mockRejectedValueOnce(new Error("secret internal details"))
    const failed = store.execute("video", {
      type: "label",
      team: "Team A",
      action: "Pass",
      label: "Must not survive"
    })
    const next = store.execute("video", start("Shot"))

    await expect(failed).rejects.toThrow("Your changes were not saved")
    expect(original.labels).toEqual(["Saved"])
    await expect(next).resolves.toEqual({
      actions: [action({ labels: ["Saved"] }), action({ action: "Shot" })],
      changed: true
    })
    expect(data[timelineStorageKey("video")]).toEqual([
      action({ labels: ["Saved"] }),
      action({ action: "Shot" })
    ])
  })

  test("failed delete leaves the original action intact", async () => {
    const original = [action()]
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: original
    })
    storage.set.mockRejectedValueOnce(new Error("quota exceeded"))
    await expect(
      store.execute("video", {
        type: "delete",
        team: "Team A",
        action: "Pass",
        start: 0
      })
    ).rejects.toThrow("write failed")
    expect(data[timelineStorageKey("video")]).toEqual([action()])
  })

  test("failed read does not turn into an empty successful write", async () => {
    const { storage, store } = memoryStorage()
    storage.get.mockRejectedValueOnce(new Error("permission details"))
    await expect(store.execute("video", start())).rejects.toThrow(
      "could not be read"
    )
    expect(storage.set).not.toHaveBeenCalled()
    await expect(store.execute("video", start())).resolves.toMatchObject({
      changed: true
    })
  })

  test.each([
    null,
    {},
    [action({ labels: null as unknown as string[] })],
    [action({ end: NaN })],
    [action({ start: -1 })],
    [action(), { team: "Incomplete" }]
  ])("does not overwrite malformed persisted data: %j", async (invalid) => {
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: invalid,
      timelines: { video: [action()] }
    })
    await expect(store.execute("video", start())).rejects.toThrow(
      "Existing data was not changed"
    )
    expect(storage.set).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toBe(invalid)
  })
})

describe("timeline message validation and service-worker responses", () => {
  const sender = {
    id: "our-extension",
    url: "https://www.youtube.com/watch?v=video",
    tab: { url: "https://www.youtube.com/watch?v=video" }
  }
  const request = (operation: unknown = { type: "read" }) => ({
    type: TIMELINE_MESSAGE_TYPE,
    videoId: "video",
    operation
  })

  test.each([
    null,
    [],
    {},
    { ...request(), type: "OTHER" },
    { ...request(), videoId: "" },
    { ...request(), videoId: "../video" },
    { ...request(), videoId: 123 },
    request(null),
    request({ type: "replace", actions: [] }),
    request({ ...start(), team: " " }),
    request({ ...start(), action: null }),
    request({ ...start(), start: -1 }),
    request({ ...start(), start: NaN }),
    request({ ...start(), start: Infinity }),
    request({ ...start(), start: "0" }),
    request({ type: "stop", team: "A", action: "Pass" }),
    request({ type: "label", team: "A", action: "Pass", label: {} }),
    ...["stop", "label"].flatMap((type) =>
      [undefined, null, -1, NaN, Infinity, "0"].map((expectedStart) =>
        request({
          type,
          team: "Team A",
          action: "Pass",
          end: 1,
          label: "Good",
          expectedStart
        })
      )
    ),
    request({ type: "delete", team: "A", action: "Pass" })
  ])("rejects malformed request %j", (invalid) => {
    expect(isTimelineRequest(invalid)).toBe(false)
  })

  test("validates direct store calls before touching storage", async () => {
    const { storage, store } = memoryStorage()
    await expect(store.execute("../invalid", start())).rejects.toThrow(
      "Invalid timeline request"
    )
    expect(storage.get).not.toHaveBeenCalled()
  })

  test.each([
    { ...sender, id: "other-extension" },
    { ...sender, id: undefined },
    { ...sender, tab: undefined },
    { ...sender, tab: { url: "https://example.com" } },
    { ...sender, tab: { url: "https://www.youtube.com.evil.test/" } },
    { ...sender, tab: { url: "http://www.youtube.com/" } },
    { ...sender, tab: { url: "not a url" } },
    { ...sender, url: "https://evil.test/iframe" }
  ])("rejects untrusted sender %j before reading storage", (untrusted) => {
    const { storage, store } = memoryStorage()
    const respond = jest.fn()
    const listener = createTimelineMessageListener(store, "our-extension")
    expect(listener(request(), untrusted, respond)).toBe(false)
    expect(respond).toHaveBeenCalledWith({
      ok: false,
      error: "Unauthorized timeline request."
    })
    expect(storage.get).not.toHaveBeenCalled()
  })

  test("ignores unrelated messages", () => {
    const { storage, store } = memoryStorage()
    const respond = jest.fn()
    const listener = createTimelineMessageListener(store, "our-extension")
    expect(listener({ type: "OTHER" }, sender, respond)).toBe(false)
    expect(respond).not.toHaveBeenCalled()
    expect(storage.get).not.toHaveBeenCalled()
  })

  test("malformed matching messages return a sanitized validation error", () => {
    const { storage, store } = memoryStorage()
    const respond = jest.fn()
    const listener = createTimelineMessageListener(store, "our-extension")
    expect(listener(request({ type: "unknown" }), sender, respond)).toBe(false)
    expect(respond).toHaveBeenCalledWith({
      ok: false,
      error: "Invalid timeline request."
    })
    expect(storage.get).not.toHaveBeenCalled()
  })

  test("keeps the channel open and acknowledges only after durable persistence", async () => {
    const { data, storage, store } = memoryStorage()
    const saving = deferred()
    const releaseSave = deferred()
    storage.set.mockImplementationOnce(async (items) => {
      saving.resolve()
      await releaseSave.promise
      Object.assign(data, items)
    })
    const listener = createTimelineMessageListener(store, "our-extension")
    const respond = jest.fn()
    let received: Promise<TimelineResponse>
    received = new Promise((resolve) => {
      expect(
        listener(request(start()), sender, (response) => {
          respond(response)
          resolve(response)
        })
      ).toBe(true)
    })

    await saving.promise
    expect(respond).not.toHaveBeenCalled()
    releaseSave.resolve()
    await expect(received).resolves.toEqual({
      ok: true,
      changed: true,
      actions: [action()]
    })
    expect(data[timelineStorageKey("video")]).toEqual([action()])
  })

  test("storage errors never send modified actions or raw error details", async () => {
    const storage: TimelineStorage = {
      get: async () => ({}),
      set: async () => {
        throw new Error("private storage implementation details")
      }
    }
    const listener = createTimelineMessageListener(
      createTimelineStore(storage),
      "our-extension"
    )
    const response = await new Promise<TimelineResponse>((resolve) => {
      expect(listener(request(start()), sender, resolve)).toBe(true)
    })
    expect(response).toEqual({
      ok: false,
      error: "Timeline storage write failed. Your changes were not saved."
    })
    expect(response).not.toHaveProperty("actions")
  })

  test("conflicts return a safe error without changing the replacement interval", async () => {
    const { store, storage } = memoryStorage({
      [timelineStorageKey("video")]: [action({ start: 20 })]
    })
    const listener = createTimelineMessageListener(store, "our-extension")
    const response = await new Promise<TimelineResponse>((resolve) => {
      expect(
        listener(
          request({
            type: "stop",
            team: "Team A",
            action: "Pass",
            end: 30,
            expectedStart: 0
          }),
          sender,
          resolve
        )
      ).toBe(true)
    })
    expect(response).toEqual({
      ok: false,
      error: "Timeline action changed. Refresh the timeline and try again."
    })
    expect(storage.set).not.toHaveBeenCalled()
  })
})
