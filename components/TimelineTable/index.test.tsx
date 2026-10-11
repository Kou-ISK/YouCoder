import { act, fireEvent, render, screen, within } from "@testing-library/react"
import React from "react"

import { TimelineTable } from "."
import type { Action } from "../TimelinePanel/types"

const firstAction: Action = {
  id: "first-action",
  team: "Team A",
  action: "Pass",
  start: 1000,
  end: 2000,
  labels: []
}
const secondAction: Action = {
  ...firstAction,
  id: "second-action"
}

const beginDelete = (row: HTMLElement) => {
  fireEvent.mouseEnter(row)
  fireEvent.click(within(row).getByTitle("クリックして削除を開始"))
}

const confirmDelete = (row: HTMLElement) => {
  fireEvent.click(within(row).getByRole("button", { name: "削除確認" }))
}

describe("TimelineTable action identity", () => {
  const onDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test("identical action values delete only the selected stable ID without duplicate keys", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    render(
      <TimelineTable
        actions={[firstAction, secondAction]}
        onDelete={onDelete}
      />
    )
    const selectedRow = screen.getAllByRole("row")[2]

    beginDelete(selectedRow)
    expect(onDelete).not.toHaveBeenCalled()
    confirmDelete(selectedRow)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(secondAction.id)
    expect(consoleError).not.toHaveBeenCalled()
  })

  test("sorting preserves the same row and its pending deletion by ID", () => {
    const laterAction = { ...secondAction, end: 3000 }
    const actions = [firstAction, laterAction]
    const { rerender } = render(
      <TimelineTable
        actions={actions}
        onDelete={onDelete}
        sortConfig={{ key: "end", direction: "asc" }}
      />
    )
    const selectedRow = screen.getAllByRole("row")[1]
    beginDelete(selectedRow)

    rerender(
      <TimelineTable
        actions={actions}
        onDelete={onDelete}
        sortConfig={{ key: "end", direction: "desc" }}
      />
    )

    const reorderedRows = screen.getAllByRole("row")
    expect(reorderedRows[2]).toBe(selectedRow)
    expect(
      within(reorderedRows[1]).queryByRole("button", { name: "削除確認" })
    ).not.toBeInTheDocument()
    expect(
      within(selectedRow).getByRole("button", { name: "削除確認" })
    ).toBeInTheDocument()
    confirmDelete(selectedRow)
    expect(onDelete).toHaveBeenCalledWith(firstAction.id)
  })

  test("removing a pending row does not transfer confirmation to its replacement", () => {
    const { rerender } = render(
      <TimelineTable
        actions={[firstAction, secondAction]}
        onDelete={onDelete}
      />
    )
    beginDelete(screen.getAllByRole("row")[1])

    rerender(<TimelineTable actions={[secondAction]} onDelete={onDelete} />)

    expect(
      screen.queryByRole("button", { name: "削除確認" })
    ).not.toBeInTheDocument()
    const remainingRow = screen.getAllByRole("row")[1]
    beginDelete(remainingRow)
    expect(onDelete).not.toHaveBeenCalled()
    confirmDelete(remainingRow)
    expect(onDelete).toHaveBeenCalledWith(secondAction.id)
  })

  test("filtering out a pending row cancels its confirmation when it becomes visible again", () => {
    const { rerender } = render(
      <TimelineTable actions={[firstAction]} onDelete={onDelete} />
    )
    beginDelete(screen.getAllByRole("row")[1])

    rerender(
      <TimelineTable
        actions={[firstAction]}
        onDelete={onDelete}
        filterConfig={{ team: "Team B" }}
      />
    )
    rerender(<TimelineTable actions={[firstAction]} onDelete={onDelete} />)

    expect(
      screen.queryByRole("button", { name: "削除確認" })
    ).not.toBeInTheDocument()
    beginDelete(screen.getAllByRole("row")[1])
    expect(onDelete).not.toHaveBeenCalled()
  })

  test("Escape cancels the old timeout so a new confirmation keeps its full window", () => {
    render(
      <TimelineTable
        actions={[firstAction, secondAction]}
        onDelete={onDelete}
      />
    )
    const rows = screen.getAllByRole("row")
    beginDelete(rows[1])
    act(() => jest.advanceTimersByTime(2000))
    fireEvent.keyDown(document, { key: "Escape" })

    beginDelete(rows[2])
    act(() => jest.advanceTimersByTime(1000))

    expect(
      within(rows[2]).getByRole("button", { name: "削除確認" })
    ).toBeInTheDocument()
    confirmDelete(rows[2])
    expect(onDelete).toHaveBeenCalledWith(secondAction.id)
  })

  test("expired confirmation requires a new first click before deleting", () => {
    render(<TimelineTable actions={[firstAction]} onDelete={onDelete} />)
    const selectedRow = screen.getAllByRole("row")[1]
    beginDelete(selectedRow)

    act(() => jest.advanceTimersByTime(3000))

    expect(
      screen.queryByRole("button", { name: "削除確認" })
    ).not.toBeInTheDocument()
    beginDelete(selectedRow)
    expect(onDelete).not.toHaveBeenCalled()
    confirmDelete(selectedRow)
    expect(onDelete).toHaveBeenCalledWith(firstAction.id)
  })
})
