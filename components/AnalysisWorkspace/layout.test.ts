import {
  arrangePanels,
  defaultPanelLayout,
  panelsOverlap,
  workspaceBounds
} from "./layout"

test("moving and enlarging a panel moves its neighbour without covering controls", () => {
  const bounds = workspaceBounds(1390)
  const taggingPanel = {
    position: { x: 30, y: 30 },
    size: { width: 444, height: 350 }
  }
  const result = arrangePanels(
    {
      taggingPanel,
      timelinePanel: defaultPanelLayout("timelinePanel", bounds)
    },
    bounds
  )
  expect(result.taggingPanel).toEqual(taggingPanel)
  expect(result.timelinePanel.position.x).toBe(490)
  expect(
    result.timelinePanel.position.x + result.timelinePanel.size.width
  ).toBeLessThanOrEqual(bounds.width)
  expect(panelsOverlap(result.taggingPanel, result.timelinePanel)).toBe(false)
})

test("a saved overlapping narrow arrangement is repaired within the canvas", () => {
  const bounds = workspaceBounds(325)
  const result = arrangePanels(
    {
      taggingPanel: {
        position: { x: 0, y: 0 },
        size: { width: 325, height: 330 }
      },
      timelinePanel: {
        position: { x: 0, y: 300 },
        size: { width: 325, height: 340 }
      }
    },
    bounds
  )
  expect(result.timelinePanel.position.y).toBe(346)
  expect(
    result.timelinePanel.position.y + result.timelinePanel.size.height
  ).toBeLessThanOrEqual(bounds.height)
  expect(panelsOverlap(result.taggingPanel, result.timelinePanel)).toBe(false)
})

test("an edit that leaves no usable room is rejected rather than hiding a panel", () => {
  const bounds = workspaceBounds(1200)
  expect(
    arrangePanels(
      {
        taggingPanel: { position: { x: 0, y: 0 }, size: bounds },
        timelinePanel: defaultPanelLayout("timelinePanel", bounds)
      },
      bounds
    )
  ).toBeNull()
})
