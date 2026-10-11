import {
  addLabel,
  addTeam,
  deleteAction,
  exportActionsToCSV,
  getActions,
  getTeams,
  getYoutubeVideoId,
  loadActionsFromStorage,
  loadTimelineForVideo,
  removeTeam,
  resetState,
  saveTimelineForVideo,
  startAction,
  stopAction
} from "./actionsManager"
import { createTimelineStore } from "./timelineStore"

let database: Record<string, unknown>
let store: ReturnType<typeof createTimelineStore>
const navigate = (id: string | null) =>
  window.history.replaceState({}, "", id ? `/watch?v=${id}` : "/")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
beforeEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  resetState()
  navigate("videoA")
  database = {}
  ;(chrome.storage.local.get as jest.Mock).mockImplementation(async () =>
    clone(database)
  )
  ;(chrome.storage.local.set as jest.Mock).mockImplementation(
    async (values) => {
      Object.assign(database, clone(values))
    }
  )
  let nextId = 0
  store = createTimelineStore(
    chrome.storage.local,
    () => `interval-${++nextId}`
  )
  ;(chrome.runtime.sendMessage as jest.Mock).mockImplementation(
    async ({ videoId, operation }) => {
      try {
        return { ok: true, ...(await store.execute(videoId, operation)) }
      } catch {
        return { ok: false, error: "Storage operation failed" }
      }
    }
  )
  document.querySelector = jest.fn().mockReturnValue({
    currentTime: 10,
    readyState: 4,
    networkState: 1,
    error: null
  })
})

describe("永続化済みのチーム情報", () => {
  test("追加・重複排除・削除", async () => {
    await addTeam("日本代表")
    await addTeam("日本代表")
    expect(getTeams()).toEqual(["日本代表"])
    await removeTeam("日本代表")
    expect(getTeams()).toEqual([])
  })
  test("保存失敗を隠さず状態を変更しない", async () => {
    ;(chrome.storage.local.set as jest.Mock).mockRejectedValue(
      new Error("quota")
    )
    await expect(addTeam("A")).rejects.toThrow()
    expect(getTeams()).toEqual([])
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
  })
  test("設定の読み込みと失敗を呼び出し元に通知", async () => {
    database.teams = ["A"]
    await loadActionsFromStorage()
    expect(getTeams()).toEqual(["A"])
    ;(chrome.storage.local.get as jest.Mock).mockRejectedValue(
      new Error("read")
    )
    await expect(loadActionsFromStorage()).rejects.toThrow()
  })
})

describe("動画別の保存とナビゲーション", () => {
  test("A→B→Aで記録とラベルが混ざらない", async () => {
    await startAction("A", "パス")
    navigate("videoB")
    expect(getActions()).toEqual([])
    await startAction("B", "シュート")
    await addLabel(getActions()[0].id, "結果 - 成功")
    expect(getActions()).toEqual([
      expect.objectContaining({ team: "B", labels: ["結果 - 成功"] })
    ])
    navigate("videoA")
    await loadTimelineForVideo("videoA")
    expect(getActions()).toEqual([
      expect.objectContaining({ team: "A", labels: [] })
    ])
  })
  test("同時開始、終了、ラベル、削除が永続データに反映される", async () => {
    await Promise.all([startAction("A", "パス"), startAction("B", "パス")])
    await addLabel(getActions()[0].id, "成功")
    await stopAction(getActions()[0].id)
    expect(getActions()[0]).toMatchObject({ end: 10000, labels: ["成功"] })
    expect(await deleteAction(getActions()[0].id)).toBe(true)
    expect(getActions()).toHaveLength(1)
    await expect(deleteAction("missing-id")).rejects.toThrow()
  })
  test("二重クリックで進行中アクションを複製しない", async () => {
    await Promise.all([startAction("A", "パス"), startAction("A", "パス")])
    expect(getActions()).toHaveLength(1)
  })
  test("別動画への保存指示で現在の配列を書かない", async () => {
    await startAction("A", "パス")
    expect(await saveTimelineForVideo("videoB")).toBe(false)
    expect(database["youCoder.timeline.videoB"]).toBeUndefined()
    expect(await saveTimelineForVideo("videoA")).toBe(true)
  })
  test("遅いA読込がBの画面状態を上書きしない", async () => {
    let resolveA: (value: unknown) => void
    ;(chrome.runtime.sendMessage as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveA = resolve
        })
    )
    const a = loadTimelineForVideo("videoA")
    navigate("videoB")
    await startAction("B", "シュート")
    resolveA!({
      ok: true,
      actions: [
        { id: "old-a", team: "A", action: "パス", start: 0, labels: [] }
      ],
      changed: false
    })
    await a
    expect(getActions()[0].team).toBe("B")
  })
  test("動画以外へ遷移したら状態を消す", async () => {
    await startAction("A", "パス")
    navigate(null)
    await loadTimelineForVideo(null)
    expect(getYoutubeVideoId()).toBeNull()
    expect(getActions()).toEqual([])
    await expect(startAction("B", "パス")).rejects.toThrow()
    expect(await saveTimelineForVideo(null)).toBe(false)
  })
  test("返された配列を変更しても保存状態を変えない", async () => {
    await startAction("A", "パス")
    getActions()[0].labels.push("external")
    expect(getActions()[0].labels).toEqual([])
  })
})

describe("保存失敗を成功に見せない", () => {
  test("quota失敗時は未保存の追加・削除を画面状態へ反映しない", async () => {
    await startAction("A", "パス")
    ;(chrome.storage.local.set as jest.Mock).mockRejectedValue(
      new Error("quota")
    )
    await expect(startAction("B", "シュート")).rejects.toThrow()
    await expect(deleteAction(getActions()[0].id)).rejects.toThrow()
    expect(getActions()).toHaveLength(1)
    expect(getActions()[0].team).toBe("A")
    expect(sessionStorage.setItem).not.toHaveBeenCalled()
  })
  test("拡張接続消失と読込失敗は例外", async () => {
    ;(chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined)
    await expect(startAction("A", "パス")).rejects.toThrow()
    await expect(saveTimelineForVideo("videoA")).rejects.toThrow()
    await expect(loadTimelineForVideo("videoA")).rejects.toThrow()
  })
  test("動画時刻0は有効、動画不在やNaNは記録しない", async () => {
    ;(document.querySelector as jest.Mock).mockReturnValue({
      currentTime: 0,
      readyState: 4,
      networkState: 1
    })
    await startAction("A", "開始")
    expect(getActions()[0].start).toBe(0)
    ;(document.querySelector as jest.Mock).mockReturnValue(null)
    await expect(startAction("B", "不正")).rejects.toThrow()
    ;(document.querySelector as jest.Mock).mockReturnValue({
      currentTime: NaN,
      readyState: 4,
      networkState: 1
    })
    await expect(startAction("B", "不正")).rejects.toThrow()
  })
})

test("CSVファイルを生成してダウンロードする", () => {
  const anchor = { href: "", download: "", click: jest.fn() }
  jest.spyOn(document, "createElement").mockReturnValue(anchor as any)
  exportActionsToCSV([
    { id: "csv-action", team: "日本", action: "パス", start: 0, labels: [] }
  ])
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  expect(anchor.click).toHaveBeenCalled()
  expect(URL.revokeObjectURL).toHaveBeenCalled()
})

describe("永続IDで同時刻の記録を区別", () => {
  test("停止後に同じ時刻へ戻って再開始しても古いIDで新記録を変更しない", async () => {
    await startAction("A", "パス")
    const originalId = getActions()[0].id
    await stopAction(originalId)
    await startAction("A", "パス")
    const restarted = getActions()[1]
    expect(restarted.start).toBe(getActions()[0].start)
    expect(restarted.id).not.toBe(originalId)
    await expect(addLabel(originalId, "誤ラベル")).rejects.toThrow()
    await expect(stopAction(originalId)).rejects.toThrow()
    expect(getActions()[1]).toEqual(restarted)
    await deleteAction(restarted.id)
    expect(getActions().map((item) => item.id)).toEqual([originalId])
  })

  test("旧データの同一tupleを移行し、それぞれ固有IDで削除できる", async () => {
    const legacy = {
      team: "A",
      action: "パス",
      start: 10000,
      end: 10000,
      labels: []
    }
    database.timelines = { videoA: [legacy, legacy] }
    await loadTimelineForVideo("videoA")
    const [first, second] = getActions()
    expect(first.id).not.toBe(second.id)
    await deleteAction(second.id)
    await loadTimelineForVideo("videoA")
    expect(getActions()).toEqual([first])
    expect(database.timelines).toEqual({ videoA: [legacy, legacy] })
  })
})
