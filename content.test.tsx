import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import MainContent from "./content"
import { resetState } from "./lib/actionsManager"
import type { TimelineAction, TimelineResponse } from "./lib/timelineStore"

jest.mock(
  "components/TaggingPanel",
  () => ({
    TaggingPanel: ({ onActionToggle, onLabelClick, activeActions }) => (
      <div>
        <button onClick={() => onActionToggle("Team A", "Pass")}>
          Toggle pass
        </button>
        <button onClick={() => onLabelClick("Result - good")}>Add label</button>
        <output data-testid="active-actions">
          {JSON.stringify(Array.from(activeActions))}
        </output>
      </div>
    )
  }),
  { virtual: true }
)

jest.mock(
  "components/TimelinePanel",
  () => ({
    TimelinePanel: ({ actions, onSave, onDelete }) => (
      <div>
        <output data-testid="timeline">{JSON.stringify(actions)}</output>
        <button onClick={onSave}>Save</button>
        <button
          onClick={() => {
            const action = actions[0]
            if (action) onDelete(action.team, action.action, action.start)
          }}>
          Delete first
        </button>
      </div>
    )
  }),
  { virtual: true }
)

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const action = (overrides: Partial<TimelineAction> = {}): TimelineAction => ({
  team: "Team A",
  action: "Pass",
  start: 10000,
  labels: [],
  ...overrides
})

const success = (
  actions: TimelineAction[] = [],
  changed = false
): TimelineResponse => ({ ok: true, actions, changed })

const sendMessage = chrome.runtime.sendMessage as jest.Mock
const timeline = (): TimelineAction[] =>
  JSON.parse(screen.getByTestId("timeline").textContent || "[]")

const mount = async () => {
  await act(async () => {
    render(<MainContent />)
  })
}

const navigate = async (videoId: string) => {
  await act(async () => {
    window.history.replaceState({}, "", `/watch?v=${videoId}`)
    document.dispatchEvent(new Event("yt-navigate-finish"))
  })
}

const storageChanged = async (videoId: string, actions: TimelineAction[]) => {
  await act(async () => {
    const changes = {
      [`youCoder.timeline.${videoId}`]: { newValue: actions }
    }
    for (const [listener] of (chrome.storage.onChanged.addListener as jest.Mock)
      .mock.calls) {
      listener(changes, "local")
    }
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  resetState()
  window.history.replaceState({}, "", "/watch?v=videoA")
  ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
    teams: ["Team A"],
    buttonSets: [
      {
        setName: "Set",
        buttons: [{ action: "Pass", labels: { Result: ["good"] } }]
      }
    ],
    selectedButtonSet: "Set",
    showExtension: true
  })
  sendMessage.mockReset().mockResolvedValue(success())
  ;(document.querySelector as jest.Mock).mockImplementation((selector) =>
    selector === "video"
      ? {
          currentTime: 10,
          currentSrc: "https://www.youtube.com/video",
          readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
          networkState: HTMLMediaElement.NETWORK_IDLE,
          error: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      : null
  )
})

afterEach(cleanup)

describe("content timeline safety", () => {
  test("does not overwrite a committed operation with a delayed background read", async () => {
    const backgroundRead = deferred<TimelineResponse>()
    const recorded = action()
    await mount()
    sendMessage
      .mockReturnValueOnce(backgroundRead.promise)
      .mockResolvedValueOnce(success([recorded], true))
      .mockResolvedValueOnce(success([recorded]))
    await storageChanged("videoA", [])

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })
    expect(timeline()).toEqual([recorded])

    await act(async () => backgroundRead.resolve(success()))

    expect(timeline()).toEqual([recorded])
    expect(screen.getByTestId("active-actions")).toHaveTextContent(
      "Team A_Pass"
    )
  })

  test("does not mutate a timeline until the first video load completes", async () => {
    const initialRead = deferred<TimelineResponse>()
    sendMessage.mockReturnValueOnce(initialRead.promise)
    await mount()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ operation: { type: "read" } })
    )
    await act(async () => initialRead.resolve(success()))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: "videoA",
        operation: expect.objectContaining({ type: "start" })
      })
    )
  })

  test.each([
    ["Toggle pass", "stop"],
    ["Delete first", "delete"]
  ])(
    "rejects stale %s controls after the URL changes and permits them after B loads",
    async (buttonName, operationType) => {
      const initial = action()
      const nextVideo = action({ start: 2000 })
      const navigationRead = deferred<TimelineResponse>()
      sendMessage.mockResolvedValueOnce(success([initial]))
      await mount()
      expect(timeline()).toEqual([initial])

      // YouTube can update history before emitting yt-navigate-finish. The
      // visible row and controls still belong to A during this interval.
      window.history.replaceState({}, "", "/watch?v=videoB")
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: buttonName }))
      })

      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(timeline()).toEqual([initial])

      sendMessage.mockReturnValueOnce(navigationRead.promise)
      await act(async () => {
        document.dispatchEvent(new Event("yt-navigate-finish"))
      })
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
      })
      expect(sendMessage).toHaveBeenCalledTimes(2)
      expect(sendMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          videoId: "videoB",
          operation: { type: "read" }
        })
      )

      await act(async () => navigationRead.resolve(success([nextVideo])))
      expect(timeline()).toEqual([nextVideo])
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: buttonName }))
      })

      const mutations = sendMessage.mock.calls
        .map(([message]) => message)
        .filter((message) => message.operation.type !== "read")
      expect(mutations).toEqual([
        expect.objectContaining({
          videoId: "videoB",
          operation: expect.objectContaining({
            type: operationType,
            team: "Team A",
            action: "Pass",
            ...(operationType === "stop"
              ? { expectedStart: 2000 }
              : { start: 2000 })
          })
        })
      ])
    }
  )

  test("does not restore an old operation reload after A to B to A navigation", async () => {
    const oldReload = deferred<TimelineResponse>()
    const recorded = action()
    const latest = action({ labels: ["Result - latest"] })
    sendMessage
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(success([recorded], true))
      .mockReturnValueOnce(oldReload.promise)
      .mockResolvedValueOnce(success([action({ team: "Team B" })]))
      .mockResolvedValueOnce(success([latest]))
    await mount()

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })
    await navigate("videoB")
    await navigate("videoA")
    expect(timeline()).toEqual([latest])

    await act(async () => oldReload.resolve(success([recorded])))

    expect(timeline()).toEqual([latest])
  })

  test("keeps the latest multi-tab storage update when read responses arrive out of order", async () => {
    const olderRead = deferred<TimelineResponse>()
    const older = action()
    const latest = action({ end: 15000, labels: ["Result - good"] })
    await mount()
    sendMessage
      .mockReturnValueOnce(olderRead.promise)
      .mockResolvedValueOnce(success([latest]))

    await storageChanged("videoA", [older])
    await storageChanged("videoA", [latest])
    expect(timeline()).toEqual([latest])

    await act(async () => olderRead.resolve(success([older])))

    expect(timeline()).toEqual([latest])
    expect(screen.getByTestId("active-actions")).toHaveTextContent("[]")
  })

  test("disables tagging and timeline controls while a save is pending", async () => {
    const pendingWrite = deferred<TimelineResponse>()
    await mount()
    sendMessage.mockReturnValueOnce(pendingWrite.promise)

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })

    for (const name of ["Toggle pass", "Add label", "Save", "Delete first"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled()
    }
    expect(screen.getByText("記録を保存中…")).toHaveAttribute("role", "status")

    await act(async () => pendingWrite.resolve(success([action()], true)))

    for (const name of ["Toggle pass", "Add label", "Save", "Delete first"]) {
      expect(screen.getByRole("button", { name })).not.toBeDisabled()
    }
    expect(screen.queryByText("記録を保存中…")).not.toBeInTheDocument()
  })

  test("retains the saved timeline and displays a failure when a write rejects", async () => {
    const saved = action()
    sendMessage.mockResolvedValueOnce(success([saved]))
    await mount()
    sendMessage.mockRejectedValueOnce(new Error("Storage quota exceeded"))

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })

    expect(timeline()).toEqual([saved])
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Toggle pass" })
    ).not.toBeDisabled()
  })

  test("does not display a previous video's delayed write failure on the new video", async () => {
    const oldWrite = deferred<TimelineResponse>()
    await mount()
    sendMessage.mockReturnValueOnce(oldWrite.promise)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })
    await navigate("videoB")

    await act(async () => oldWrite.reject(new Error("Previous video failed")))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(timeline()).toEqual([])

    await navigate("videoA")
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  test("does not clear a new video's read failure when an old write succeeds", async () => {
    const oldWrite = deferred<TimelineResponse>()
    await mount()
    sendMessage.mockReturnValueOnce(oldWrite.promise)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })
    sendMessage.mockRejectedValueOnce(new Error("New video read failed"))
    await navigate("videoB")
    expect(screen.getByRole("alert")).toBeInTheDocument()

    await act(async () => oldWrite.resolve(success([action()], true)))

    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  test("still reports write failures after a same-video storage refresh", async () => {
    const pendingWrite = deferred<TimelineResponse>()
    await mount()
    sendMessage.mockReturnValueOnce(pendingWrite.promise)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Toggle pass" }))
    })
    const otherTabAction = action({ team: "Team B" })
    sendMessage.mockResolvedValueOnce(success([otherTabAction]))
    await storageChanged("videoA", [otherTabAction])

    await act(async () => pendingWrite.reject(new Error("Write failed")))

    expect(timeline()).toEqual([otherTabAction])
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  test("keeps captured label targets when another tab restarts an interval mid-batch", async () => {
    const firstLabel = deferred<TimelineResponse>()
    const first = action()
    const second = action({ team: "Team B", start: 5000 })
    const replacement = action({ team: "Team B", start: 15000 })
    sendMessage.mockResolvedValueOnce(success([first, second]))
    await mount()
    sendMessage.mockReturnValueOnce(firstLabel.promise)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add label" }))
    })
    sendMessage.mockResolvedValueOnce(success([first, replacement]))
    await storageChanged("videoA", [first, replacement])
    sendMessage.mockResolvedValueOnce({ ok: false, error: "Target changed" })

    await act(async () => firstLabel.resolve(success([first, second], true)))

    expect(sendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        videoId: "videoA",
        operation: expect.objectContaining({
          type: "label",
          team: "Team B",
          action: "Pass",
          expectedStart: 5000
        })
      })
    )
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
