import { render, screen } from "@testing-library/react"
import React from "react"

import { TaggingPanelContent } from "./TaggingPanelContent"

// ActionsSection と LabelsSection のモック
jest.mock("./ActionsSection", () => ({
  ActionsSection: ({
    teams,
    actions
  }: {
    teams: string[]
    actions: Record<string, string>
  }) => (
    <div data-testid="actions-section">
      {teams.map((team) => (
        <div key={team}>{team}</div>
      ))}
      {Object.values(actions).map((action) => (
        <button key={action}>{action}</button>
      ))}
    </div>
  )
}))

jest.mock("./LabelsSection", () => ({
  LabelsSection: ({
    labels
  }: {
    labels: Record<string, string[]> | string[]
  }) => (
    <div data-testid="labels-section">
      {Array.isArray(labels)
        ? labels.map((label) => <button key={label}>{label}</button>)
        : Object.values(labels)
            .flat()
            .map((label) => <button key={label}>{label}</button>)}
    </div>
  )
}))

describe("TaggingPanelContent", () => {
  const defaultProps = {
    teams: ["Team A", "Team B"],
    actions: { pass: "Pass", shoot: "Shoot" },
    labels: {
      Result: ["Good", "Bad"],
      Distance: ["Short", "Long"]
    },
    activeActions: new Set<string>(),
    activeLabels: new Set<string>(),
    onActionToggle: jest.fn(),
    onLabelClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("ActionsSection と LabelsSection が表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByTestId("actions-section")).toBeInTheDocument()
    expect(screen.getByTestId("labels-section")).toBeInTheDocument()
  })

  test("チーム名が正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByText("Team A")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()
  })

  test("アクションボタンが正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByText("Pass")).toBeInTheDocument()
    expect(screen.getByText("Shoot")).toBeInTheDocument()
  })

  test("ラベルボタンが正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })
})
