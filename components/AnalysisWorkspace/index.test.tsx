import { act, fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { AnalysisWorkspace, useWorkspacePanel } from "."
import { DraggableResizable } from "../DraggableResizable"
import { fitPanel, LAYOUT_KEY, parseLayouts, workspaceBounds } from "./layout"

const Panel = () => {
  const { position, size, bounds, handlePositionChange, handleSizeChange } =
    useWorkspacePanel("taggingPanel")
  return (
    <DraggableResizable
      title="テスト"
      initialPosition={position}
      initialSize={size}
      bounds={bounds}
      onPositionChange={handlePositionChange}
      onSizeChange={handleSizeChange}>
      <button>記録</button>
    </DraggableResizable>
  )
}
const renderWorkspace = () =>
  render(
    <AnalysisWorkspace>
      <Panel />
    </AnalysisWorkspace>
  )
let width = 1200
let resized: () => void

beforeEach(() => {
  width = 1200
  localStorage.clear()
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(() => ({
      width,
      height: 420,
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: 420,
      toJSON: () => ({})
    }))
  global.ResizeObserver = class {
    constructor(callback) {
      resized = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
})
afterEach(() => jest.restoreAllMocks())

test("saved position and dimensions reach the actual panel after mounting", () => {
  localStorage.setItem(
    LAYOUT_KEY,
    JSON.stringify({
      wide: {
        taggingPanel: {
          position: { x: 50, y: 30 },
          size: { width: 500, height: 320 }
        }
      }
    })
  )
  const { container } = renderWorkspace()
  expect(container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    position: "absolute",
    left: "50px",
    top: "30px",
    width: "500px",
    height: "320px"
  })
})

test("keyboard move and resize persist and survive a component remount", () => {
  let view = renderWorkspace()
  fireEvent.keyDown(screen.getByRole("button", { name: "テストを移動" }), {
    key: "ArrowRight"
  })
  fireEvent.keyDown(
    screen.getByRole("button", { name: "テストのサイズを変更" }),
    { key: "ArrowLeft" }
  )
  view.unmount()
  view = renderWorkspace()
  expect(view.container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    left: "10px",
    width: "370px"
  })
})

test("narrow layout fits without overwriting a saved desktop preference", () => {
  localStorage.setItem(
    LAYOUT_KEY,
    JSON.stringify({
      wide: {
        taggingPanel: {
          position: { x: 80, y: 20 },
          size: { width: 450, height: 300 }
        }
      }
    })
  )
  const view = renderWorkspace()
  const original = localStorage.getItem(LAYOUT_KEY)
  act(() => {
    width = 260
    resized()
  })
  expect(view.container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    left: "0px",
    width: "260px"
  })
  act(() => {
    width = 1200
    resized()
  })
  expect(view.container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    left: "80px",
    width: "450px"
  })
  expect(localStorage.getItem(LAYOUT_KEY)).toBe(original)
})

test("old viewport coordinates and malformed layout cannot move panels outside the workspace", () => {
  localStorage.setItem("taggingPanel_position", '{"x":1140,"y":-40}')
  localStorage.setItem(
    LAYOUT_KEY,
    '{"wide":{"taggingPanel":{"position":{"x":"bad","y":0},"size":{"width":400,"height":300}}}}'
  )
  const view = renderWorkspace()
  expect(view.container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    left: "0px",
    top: "0px"
  })
  expect(parseLayouts("not json")).toEqual({})
  expect(
    fitPanel(
      { position: { x: 9999, y: -20 }, size: { width: 2000, height: 2000 } },
      workspaceBounds(260)
    )
  ).toEqual({ position: { x: 0, y: 0 }, size: { width: 260, height: 676 } })
})

test("record controls do not start dragging or suppress their click", () => {
  renderWorkspace()
  const click = jest.fn()
  screen.getByRole("button", { name: "記録" }).addEventListener("click", click)
  fireEvent.mouseDown(screen.getByRole("button", { name: "記録" }))
  fireEvent.click(screen.getByRole("button", { name: "記録" }))
  expect(click).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem(LAYOUT_KEY)).toBeNull()
  expect(document.body.style.userSelect).toBe("")
})

test("layout storage failure is visible and a subsequent edit can persist", () => {
  renderWorkspace()
  const set = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementationOnce(() => {
      throw new Error("disk failure")
    })
  fireEvent.keyDown(screen.getByRole("button", { name: "テストを移動" }), {
    key: "ArrowRight"
  })
  expect(screen.getByRole("status")).toHaveTextContent("保存できません")
  fireEvent.keyDown(screen.getByRole("button", { name: "テストを移動" }), {
    key: "ArrowRight"
  })
  expect(screen.queryByRole("status")).not.toBeInTheDocument()
  expect(
    JSON.parse(localStorage.getItem(LAYOUT_KEY)).wide.taggingPanel.position.x
  ).toBe(20)
  set.mockRestore()
})

test("collapse and reset remain reachable independently of panel positions", () => {
  localStorage.setItem(
    LAYOUT_KEY,
    JSON.stringify({
      wide: {
        taggingPanel: {
          position: { x: 800, y: 200 },
          size: { width: 350, height: 200 }
        }
      }
    })
  )
  const view = renderWorkspace()
  fireEvent.click(screen.getByRole("button", { name: "パネルを折りたたむ" }))
  expect(screen.getByRole("button", { name: "パネルを開く" })).toHaveAttribute(
    "aria-expanded",
    "false"
  )
  fireEvent.click(screen.getByRole("button", { name: "配置をリセット" }))
  fireEvent.click(screen.getByRole("button", { name: "パネルを開く" }))
  expect(view.container.querySelector("[data-youcoder-panel]")).toHaveStyle({
    left: "0px",
    top: "0px",
    width: "380px"
  })
})

test("saving another layout after a failure retains the unsaved wide layout", () => {
  renderWorkspace()
  jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
    throw new Error("disk failure")
  })
  fireEvent.keyDown(screen.getByRole("button", { name: "テストを移動" }), {
    key: "ArrowRight"
  })
  act(() => {
    width = 800
    resized()
  })
  fireEvent.keyDown(
    screen.getByRole("button", { name: "テストのサイズを変更" }),
    { key: "ArrowLeft" }
  )
  const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY))
  expect(saved.wide.taggingPanel.position.x).toBe(10)
  expect(saved.narrow.taggingPanel.size.width).toBe(790)
  expect(screen.queryByRole("status")).not.toBeInTheDocument()
})
