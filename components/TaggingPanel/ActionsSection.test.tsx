import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { ActionsSection } from "./ActionsSection"

// ActionButtonコンポーネントのモック
jest.mock("~components/ActionButton", () => ({
  ActionButton: ({
    team,
    action,
    isActive,
    onClick
  }: {
    team: string
    action: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      data-testid={`action-button-${team}-${action}`}
      className={isActive ? "active" : ""}>
      {action}
    </button>
  )
}))

describe("ActionsSection", () => {
  const mockOnActionToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("チームとアクションを表示する", () => {
    const teams = ["Team A", "Team B"]
    const actions = { pass: "Pass", shoot: "Shoot" }
    const activeActions = new Set<string>()

    render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    // チーム名の確認
    expect(screen.getByText("Team A")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()

    // アクションボタンの確認
    expect(screen.getAllByText("Pass")).toHaveLength(2)
    expect(screen.getAllByText("Shoot")).toHaveLength(2)
  })

  test("アクションボタンクリック時に正しく呼び出される", async () => {
    const user = userEvent.setup()
    const teams = ["Team A"]
    const actions = { pass: "Pass" }
    const activeActions = new Set<string>()

    render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    const button = screen.getByTestId("action-button-Team A-Pass")
    await user.click(button)

    expect(mockOnActionToggle).toHaveBeenCalledWith("Team A", "pass")
  })

  test("空のチーム配列では何も表示しない", () => {
    const teams: string[] = []
    const actions = { pass: "Pass" }
    const activeActions = new Set<string>()

    const { container } = render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test("空のアクション辞書では何も表示しない", () => {
    const teams = ["Team A"]
    const actions = {}
    const activeActions = new Set<string>()

    const { container } = render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test("アクティブなアクションが正しく表示される", () => {
    const teams = ["Team A"]
    const actions = { pass: "Pass" }
    const activeActions = new Set(["Team A_pass"])

    render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    const button = screen.getByTestId("action-button-Team A-Pass")
    expect(button).toHaveClass("active")
  })

  test("適切なアクセシビリティ属性が設定されている", () => {
    const teams = ["Team A"]
    const actions = { pass: "Pass" }
    const activeActions = new Set<string>()

    render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    // ボタンがアクセシブルであることを確認
    expect(screen.getByRole("button", { name: "Pass" })).toBeInTheDocument()
  })

  test("チーム名が長い場合に適切に処理される", () => {
    const teams = ["Very Long Team Name That Might Overflow"]
    const actions = { pass: "Pass" }
    const activeActions = new Set<string>()

    render(
      <ActionsSection
        teams={teams}
        actions={actions}
        activeActions={activeActions}
        onActionToggle={mockOnActionToggle}
      />
    )

    const teamHeader = screen.getByText(
      "Very Long Team Name That Might Overflow"
    )
    expect(teamHeader).toBeInTheDocument()
    // 実際のクラスに基づいてテストを修正
    expect(teamHeader).toHaveClass(
      "py-2",
      "px-3",
      "text-center",
      "text-base",
      "font-medium"
    )
  })
})
