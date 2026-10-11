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
  id: "stored-1",
  team: "Team A",
  action: "Pass",
  start: 0,
  labels: [],
  ...overrides
})

const createdAction = (
  overrides: Partial<TimelineAction> = {},
  sequence = 1
): TimelineAction => action({ id: `generated-${sequence}`, ...overrides })

const legacyAction = (overrides: Partial<TimelineAction> = {}) => {
  const { id, ...legacy } = action(overrides)
  return legacy
}

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
  let nextId = 0
  const createId = jest.fn(() => `generated-${++nextId}`)
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
  return {
    data,
    storage,
    createId,
    store: createTimelineStore(storage, createId)
  }
}

const deferred = () => {
  let resolve: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe("serialized timeline persistence", () => {
  test("serializes same-video operations from separate tabs", async () => {
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
    expect(storage.get).toHaveBeenCalledTimes(2)
    expect(data[timelineStorageKey("video-a")]).toBeUndefined()

    releaseSave.resolve()
    await expect(firstTab).resolves.toMatchObject({ changed: true })
    const actions = [
      createdAction(),
      createdAction({ action: "Shot", start: 10 }, 2)
    ]
    await expect(secondTab).resolves.toEqual({ changed: true, actions })
    await expect(followingRead).resolves.toEqual({ changed: false, actions })
    expect(data[timelineStorageKey("video-a")]).toEqual(actions)
  })

  test("concurrent different-video commands preserve both videos and legacy data", async () => {
    const legacy = { existing: [legacyAction({ action: "Legacy" })] }
    const { data, storage, store } = memoryStorage({ timelines: legacy })
    await Promise.all([
      store.execute("video-a", start("Pass")),
      store.execute("video-b", start("Shot")),
      store.execute("video-a", start("Run")),
      store.execute("video-b", start("Save"))
    ])

    expect(data[timelineStorageKey("video-a")]).toEqual([
      createdAction(),
      createdAction({ action: "Run" }, 3)
    ])
    expect(data[timelineStorageKey("video-b")]).toEqual([
      createdAction({ action: "Shot" }, 2),
      createdAction({ action: "Save" }, 4)
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

  test("an empty per-video timeline takes precedence over undeleted legacy data", async () => {
    const { storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [],
      timelines: { video: [legacyAction()] }
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
      {
        actions: [],
        changed: false
      }
    )
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("treats end zero as completed and rejects later labels and stops", async () => {
    const { store } = memoryStorage()
    const started = await store.execute("video", start())
    const actionId = started.actions[0].id
    await expect(
      store.execute("video", { type: "stop", actionId, end: 0 })
    ).resolves.toEqual({ actions: [createdAction({ end: 0 })], changed: true })

    for (const operation of [
      { type: "stop", actionId, end: 100 },
      { type: "label", actionId, label: "Late" }
    ] as TimelineOperation[]) {
      await expect(store.execute("video", operation)).rejects.toThrow(
        "Timeline action changed"
      )
    }
    await expect(store.execute("video", start("Pass", 100))).resolves.toEqual({
      actions: [createdAction({ end: 0 }), createdAction({ start: 100 }, 2)],
      changed: true
    })
  })

  test("does not create duplicate simultaneous active actions", async () => {
    const { store, storage, createId } = memoryStorage()
    const results = await Promise.all([
      store.execute("video", start()),
      store.execute("video", start())
    ])
    expect(results.map((result) => result.changed)).toEqual([true, false])
    expect(results[1].actions).toEqual([createdAction()])
    expect(storage.set).toHaveBeenCalledTimes(1)
    expect(createId).toHaveBeenCalledTimes(1)
  })

  test("rejects a stop after seeking backward without modifying the interval", async () => {
    const original = action({ start: 100 })
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [original]
    })
    await expect(
      store.execute("video", { type: "stop", actionId: original.id, end: 50 })
    ).rejects.toThrow("end time cannot be before the action start time")
    expect(storage.set).not.toHaveBeenCalled()
    expect(original.end).toBeUndefined()
    expect(data[timelineStorageKey("video")]).toEqual([action({ start: 100 })])
  })

  test("labels the matching active ID and deletes only the exact ID", async () => {
    const { data, store } = memoryStorage({
      [timelineStorageKey("video")]: [
        action({ id: "completed", start: 0, end: 5 }),
        action({ id: "active", start: 10 }),
        action({ id: "other-team", team: "Team B", start: 10 })
      ]
    })
    await store.execute("video", {
      type: "label",
      actionId: "active",
      label: "Result - good"
    })
    await store.execute("video", { type: "delete", actionId: "completed" })
    expect(data[timelineStorageKey("video")]).toEqual([
      action({ id: "active", start: 10, labels: ["Result - good"] }),
      action({ id: "other-team", team: "Team B", start: 10 })
    ])
  })

  test.each<TimelineOperation>([
    { type: "stop", actionId: "stored-1", end: 30 },
    { type: "label", actionId: "stored-1", label: "Stale label" }
  ])(
    "rejects a queued stale $type after a restart at the same timestamp",
    async (stale) => {
      const { data, storage, store } = memoryStorage({
        [timelineStorageKey("video")]: [action()]
      })
      const stopped = store.execute("video", {
        type: "stop",
        actionId: "stored-1",
        end: 10
      })
      const restarted = store.execute("video", start("Pass", 0))
      const obsoleteEdit = store.execute("video", stale)
      await expect(obsoleteEdit).rejects.toThrow("Timeline action changed")
      await Promise.all([stopped, restarted])
      expect(data[timelineStorageKey("video")]).toEqual([
        action({ end: 10 }),
        createdAction()
      ])
      expect(storage.set).toHaveBeenCalledTimes(2)
    }
  )

  test("deletes the selected ID when all identifying timestamps and names repeat", async () => {
    const sameInterval = { start: 0, end: 10, labels: ["Same"] }
    const first = action({ ...sameInterval, id: "first" })
    const second = action({ ...sameInterval, id: "second" })
    const { data, store } = memoryStorage({
      [timelineStorageKey("video")]: [first, second]
    })
    await store.execute("video", { type: "delete", actionId: "second" })
    expect(data[timelineStorageKey("video")]).toEqual([first])
    await expect(
      store.execute("video", { type: "delete", actionId: "second" })
    ).rejects.toThrow("Timeline action changed")
    expect(data[timelineStorageKey("video")]).toEqual([first])
  })

  test("rejects an expected interval that has already stopped", async () => {
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [action({ end: 0 })]
    })
    await expect(
      store.execute("video", {
        type: "label",
        actionId: "stored-1",
        label: "Late label"
      })
    ).rejects.toThrow("Timeline action changed")
    expect(storage.set).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toEqual([action({ end: 0 })])
  })

  test("deduplicates repeated label retries for the same stable ID", async () => {
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [action()]
    })
    const label: TimelineOperation = {
      type: "label",
      actionId: "stored-1",
      label: "Result - good"
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
    { type: "stop", actionId: "missing", end: 5 },
    { type: "label", actionId: "missing", label: "Good" },
    { type: "delete", actionId: "missing" }
  ])("rejects an unknown $type ID without writing", async (operation) => {
    const { storage, store } = memoryStorage()
    await expect(store.execute("video", operation)).rejects.toThrow(
      "Timeline action changed"
    )
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("captures a queued operation before callers can change it", async () => {
    const { store } = memoryStorage()
    const operation = start()
    const pending = store.execute("video", operation)
    operation.action = "Changed after enqueue"
    await expect(pending).resolves.toEqual({
      actions: [createdAction()],
      changed: true
    })
  })

  test("returned results do not provide a reference to persisted data", async () => {
    const { data, store } = memoryStorage()
    const result = await store.execute("video", start())
    result.actions[0].labels.push("Not saved")
    result.actions[0].id = "Changed ID"
    result.actions.push(action({ action: "Not saved" }))
    expect(data[timelineStorageKey("video")]).toEqual([createdAction()])
  })

  test("failed writes reject without mutating saved data and the queue recovers", async () => {
    const original = action({ labels: ["Saved"] })
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: [original]
    })
    storage.set.mockRejectedValueOnce(new Error("secret internal details"))
    const failed = store.execute("video", {
      type: "label",
      actionId: original.id,
      label: "Must not survive"
    })
    const next = store.execute("video", start("Shot"))

    await expect(failed).rejects.toThrow("Your changes were not saved")
    expect(original.labels).toEqual(["Saved"])
    const actions = [
      action({ labels: ["Saved"] }),
      createdAction({ action: "Shot" })
    ]
    await expect(next).resolves.toEqual({ actions, changed: true })
    expect(data[timelineStorageKey("video")]).toEqual(actions)
  })

  test("failed delete leaves the original action intact", async () => {
    const original = [action()]
    const { data, storage, store } = memoryStorage({
      [timelineStorageKey("video")]: original
    })
    storage.set.mockRejectedValueOnce(new Error("quota exceeded"))
    await expect(
      store.execute("video", { type: "delete", actionId: "stored-1" })
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
    [action(), { team: "Incomplete" }],
    [action(), action()],
    ...[undefined, null, "", " ", 0, {}, []].map((id) => [
      { ...legacyAction(), id }
    ]),
    Array(1)
  ])("does not overwrite malformed persisted data: %j", async (invalid) => {
    const { data, storage, store, createId } = memoryStorage({
      [timelineStorageKey("video")]: invalid,
      timelines: { video: [legacyAction()] }
    })
    await expect(store.execute("video", start())).rejects.toThrow(
      "Existing data was not changed"
    )
    expect(storage.set).not.toHaveBeenCalled()
    expect(createId).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toBe(invalid)
  })

  test.each(["stored-1", "", " ", undefined, null, 123])(
    "fails closed if a generated ID is duplicate or malformed: %j",
    async (generated) => {
      const { data, storage } = memoryStorage({
        [timelineStorageKey("video")]: [action()]
      })
      const store = createTimelineStore(storage, () => generated as string)
      await expect(store.execute("video", start("Shot"))).rejects.toThrow(
        "Timeline action ID could not be created"
      )
      expect(storage.set).not.toHaveBeenCalled()
      expect(data[timelineStorageKey("video")]).toEqual([action()])
    }
  )
})

describe("persistent stable-ID migration", () => {
  test("persists legacy IDs on read and reuses them after a store restart", async () => {
    const original = legacyAction({ labels: ["Original"] })
    const legacy = { "legacy-video": [original], other: [legacyAction()] }
    const { data, storage, store } = memoryStorage({ timelines: legacy })

    const read = await store.execute("legacy-video", { type: "read" })
    const migrated = createdAction({ labels: ["Original"] })
    expect(read).toEqual({ actions: [migrated], changed: false })
    expect(storage.set).toHaveBeenCalledTimes(1)
    expect(data[timelineStorageKey("legacy-video")]).toEqual([migrated])
    expect(data.timelines).toBe(legacy)
    expect(legacy["legacy-video"]).toEqual([original])
    expect(original).not.toHaveProperty("id")

    read.actions[0].labels.push("Only the returned copy")
    read.actions[0].id = "Only the returned ID"
    const unexpectedId = jest.fn(() => "must-not-be-generated")
    const restarted = createTimelineStore(storage, unexpectedId)
    await expect(
      restarted.execute("legacy-video", { type: "read" })
    ).resolves.toEqual({
      actions: [migrated],
      changed: false
    })
    expect(unexpectedId).not.toHaveBeenCalled()
    expect(storage.get.mock.calls).toEqual([
      [[timelineStorageKey("legacy-video")]],
      [["timelines"]],
      [[timelineStorageKey("legacy-video")]]
    ])
    await restarted.execute("legacy-video", {
      type: "label",
      actionId: migrated.id,
      label: "New label"
    })
    expect(data[timelineStorageKey("legacy-video")]).toEqual([
      createdAction({ labels: ["Original", "New label"] })
    ])
    expect(legacy["legacy-video"]).toEqual([
      legacyAction({ labels: ["Original"] })
    ])
  })

  test("migrates existing per-video records while preserving IDs already present", async () => {
    const original = [
      legacyAction({ end: 10 }),
      action({ id: "retained", start: 10 })
    ]
    const { data, storage, store, createId } = memoryStorage({
      [timelineStorageKey("video")]: original
    })
    const result = await store.execute("video", { type: "read" })
    expect(result.actions).toEqual([
      createdAction({ end: 10 }),
      action({ id: "retained", start: 10 })
    ])
    expect(storage.set).toHaveBeenCalledTimes(1)
    expect(createId).toHaveBeenCalledTimes(1)
    expect(original[0]).not.toHaveProperty("id")
    const restarted = createTimelineStore(storage, () => "unexpected")
    expect(await restarted.execute("video", { type: "read" })).toEqual(result)
    expect(data[timelineStorageKey("video")]).toEqual(result.actions)
    expect(storage.set).toHaveBeenCalledTimes(1)
  })

  test("separate tabs wait for migration and receive identical durable IDs", async () => {
    const { data, storage, store, createId } = memoryStorage({
      timelines: {
        video: [legacyAction(), legacyAction({ start: 10, end: 20 })]
      }
    })
    const saving = deferred()
    const releaseSave = deferred()
    storage.set.mockImplementationOnce(async (items) => {
      saving.resolve()
      await releaseSave.promise
      Object.assign(data, items)
    })
    const firstResponse = jest.fn()
    const firstTab = store.execute("video", { type: "read" }).then((result) => {
      firstResponse(result)
      return result
    })
    await saving.promise
    const secondTab = store.execute("video", { type: "read" })
    expect(firstResponse).not.toHaveBeenCalled()
    expect(storage.get).toHaveBeenCalledTimes(2)
    expect(data[timelineStorageKey("video")]).toBeUndefined()
    releaseSave.resolve()
    expect(await secondTab).toEqual(await firstTab)
    expect(createId).toHaveBeenCalledTimes(2)
    expect(storage.set).toHaveBeenCalledTimes(1)
  })

  test.each(["legacy", "per-video"])(
    "failed %s migration exposes no IDs and leaves saved data unchanged",
    async (source) => {
      const original = [legacyAction({ labels: ["Saved"] })]
      const legacy = { video: original }
      const initial =
        source === "legacy"
          ? { timelines: legacy }
          : { [timelineStorageKey("video")]: original }
      const { data, storage, store } = memoryStorage(initial)
      storage.set.mockRejectedValueOnce(new Error("interrupted migration"))
      await expect(store.execute("video", { type: "read" })).rejects.toThrow(
        "Your changes were not saved"
      )
      expect(original).toEqual([legacyAction({ labels: ["Saved"] })])
      if (source === "legacy") {
        expect(data[timelineStorageKey("video")]).toBeUndefined()
        expect(data.timelines).toBe(legacy)
      } else {
        expect(data[timelineStorageKey("video")]).toBe(original)
      }
      const retry = await store.execute("video", { type: "read" })
      expect(retry.actions).toEqual([createdAction({ labels: ["Saved"] }, 2)])
      const restarted = createTimelineStore(storage, () => "unexpected")
      expect(await restarted.execute("video", { type: "read" })).toEqual(retry)
    }
  )

  test("a failed edit after successful migration cannot alter its durable snapshot", async () => {
    const original = legacyAction({ labels: ["Saved"] })
    const { data, storage, store } = memoryStorage({
      timelines: { video: [original] }
    })
    storage.set.mockImplementationOnce(async (items) => {
      Object.assign(data, items)
    })
    storage.set.mockRejectedValueOnce(new Error("interrupted edit"))
    await expect(
      store.execute("video", {
        type: "label",
        actionId: "generated-1",
        label: "Must not survive"
      })
    ).rejects.toThrow("Your changes were not saved")
    expect(data[timelineStorageKey("video")]).toEqual([
      createdAction({ labels: ["Saved"] })
    ])
    expect(original).toEqual(legacyAction({ labels: ["Saved"] }))
  })

  test("validates the entire legacy array before assigning any IDs", async () => {
    const legacy = { video: [legacyAction(), action(), action()] }
    const { storage, store, createId } = memoryStorage({ timelines: legacy })
    await expect(store.execute("video", { type: "read" })).rejects.toThrow(
      "Existing data was not changed"
    )
    expect(createId).not.toHaveBeenCalled()
    expect(storage.set).not.toHaveBeenCalled()
    expect(legacy.video[0]).not.toHaveProperty("id")
  })

  test("a generated migration ID cannot collide with a later persisted ID", async () => {
    const original = [legacyAction(), action({ id: "generated-1" })]
    const { storage, store, data } = memoryStorage({
      [timelineStorageKey("video")]: original
    })
    await expect(store.execute("video", { type: "read" })).rejects.toThrow(
      "Timeline action ID could not be created"
    )
    expect(storage.set).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toBe(original)
    expect(original[0]).not.toHaveProperty("id")
  })

  test("duplicate generated IDs abort migration without a partial write", async () => {
    const original = [legacyAction(), legacyAction({ start: 10 })]
    const { storage, data } = memoryStorage({
      [timelineStorageKey("video")]: original
    })
    const store = createTimelineStore(storage, () => "duplicate")
    await expect(store.execute("video", { type: "read" })).rejects.toThrow(
      "Timeline action ID could not be created"
    )
    expect(storage.set).not.toHaveBeenCalled()
    expect(data[timelineStorageKey("video")]).toBe(original)
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
    request({
      type: "stop",
      team: "A",
      action: "Pass",
      end: 10,
      expectedStart: 0
    }),
    request({
      type: "label",
      team: "A",
      action: "Pass",
      label: "Good",
      expectedStart: 0
    }),
    request({ type: "delete", team: "A", action: "Pass", start: 0 }),
    request({ type: "stop", actionId: "stored-1" }),
    request({ type: "stop", actionId: "stored-1", end: -1 }),
    request({ type: "label", actionId: "stored-1", label: {} }),
    ...["stop", "label", "delete"].flatMap((type) =>
      [undefined, null, "", " ", 0, [], {}].map((actionId) =>
        request({ type, actionId, end: 1, label: "Good" })
      )
    )
  ])("rejects malformed request %j", (invalid) => {
    expect(isTimelineRequest(invalid)).toBe(false)
  })

  test.each<TimelineOperation>([
    { type: "read" },
    start(),
    { type: "stop", actionId: "stable-id", end: 0 },
    { type: "label", actionId: "stable-id", label: "Good" },
    { type: "delete", actionId: "stable-id" }
  ])("accepts the stable-ID $type protocol", (operation) => {
    expect(isTimelineRequest(request(operation))).toBe(true)
  })

  test("validates direct store calls before touching storage", async () => {
    const { storage, store } = memoryStorage()
    await expect(store.execute("../invalid", start())).rejects.toThrow(
      "Invalid timeline request"
    )
    await expect(
      store.execute("video", {
        type: "delete",
        actionId: ""
      })
    ).rejects.toThrow("Invalid timeline request")
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
    const received = new Promise<TimelineResponse>((resolve) => {
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
      actions: [createdAction()]
    })
    expect(data[timelineStorageKey("video")]).toEqual([createdAction()])
  })

  test("storage errors never send modified actions or raw error details", async () => {
    const storage: TimelineStorage = {
      get: async () => ({}),
      set: async () => {
        throw new Error("private storage implementation details")
      }
    }
    const listener = createTimelineMessageListener(
      createTimelineStore(storage, () => "new-action"),
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

  test("ID generation errors are sanitized and do not return provisional actions", async () => {
    const { storage } = memoryStorage({
      timelines: { video: [legacyAction()] }
    })
    const listener = createTimelineMessageListener(
      createTimelineStore(storage, () => {
        throw new Error("private generation details")
      }),
      "our-extension"
    )
    const response = await new Promise<TimelineResponse>((resolve) => {
      expect(listener(request(), sender, resolve)).toBe(true)
    })
    expect(response).toEqual({
      ok: false,
      error: "Timeline action ID could not be created."
    })
    expect(storage.set).not.toHaveBeenCalled()
  })

  test("conflicts return a safe error without changing the replacement interval", async () => {
    const { store, storage } = memoryStorage({
      [timelineStorageKey("video")]: [action({ id: "replacement", start: 0 })]
    })
    const listener = createTimelineMessageListener(store, "our-extension")
    const response = await new Promise<TimelineResponse>((resolve) => {
      expect(
        listener(
          request({
            type: "stop",
            actionId: "old-id",
            end: 30
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
