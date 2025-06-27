import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TaggingPanelContent } from "./TaggingPanelContent"

describe("TaggingPanelContent", () => {
  const defaultProps = {
    teams: ["Team A", "Team B"],
    actions: { pass: "Pass", shoot: "Shoot" },
    labels: ["Good", "Bad", "Excellent"],
    activeActions: new Set<string>(),
    activeLabels: new Set<string>(),
    onActionToggle: jest.fn(),
    onLabelClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("チーム名が正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByText("Team A")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()
  })

  test("アクションボタンが正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    // 各チーム×各アクションのボタンが表示される
    expect(screen.getAllByText("Pass")).toHaveLength(2) // Team A と Team B
    expect(screen.getAllByText("Shoot")).toHaveLength(2)
  })

  test("ラベルボタンが正しく表示される", () => {
    render(<TaggingPanelContent {...defaultProps} />)

    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })

  test("カテゴリ化されたラベルが正しく表示される", () => {
    const categorizedLabels = {
      Result: ["Good", "Bad", "Excellent"],
      Distance: ["Short", "Long"]
    }

    render(<TaggingPanelContent {...defaultProps} labels={categorizedLabels} />)

    // カテゴリヘッダーの確認
    expect(screen.getByText("Result")).toBeInTheDocument()
    expect(screen.getByText("Distance")).toBeInTheDocument()

    // ラベルボタンの確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
    expect(screen.getByText("Long")).toBeInTheDocument()
  })

  test("一般カテゴリは接頭辞なしで表示される", () => {
    const generalLabels = {
      一般: ["Basic", "Simple"]
    }

    render(<TaggingPanelContent {...defaultProps} labels={generalLabels} />)

    expect(screen.getByText("Basic")).toBeInTheDocument()
    expect(screen.getByText("Simple")).toBeInTheDocument()
    // 一般カテゴリヘッダーは表示されない
    expect(screen.queryByText("一般")).not.toBeInTheDocument()
  })

  test("アクションボタンをクリックするとonActionToggleが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TaggingPanelContent {...defaultProps} />)

    const passButton = screen.getAllByText("Pass")[0] // Team AのPassボタン
    await user.click(passButton)

    expect(defaultProps.onActionToggle).toHaveBeenCalledWith("Team A", "pass")
  })

  test("ラベルボタンをクリックするとonLabelClickが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TaggingPanelContent {...defaultProps} />)

    const goodButton = screen.getByText("Good")
    await user.click(goodButton)

    expect(defaultProps.onLabelClick).toHaveBeenCalledWith("Good")
  })

  test("カテゴリ化されたラベルボタンをクリックするとカテゴリ形式で呼ばれる", async () => {
    const user = userEvent.setup()
    const categorizedLabels = {
      Result: ["Good", "Bad"],
      Type: ["Fast", "Slow"]
    }

    render(<TaggingPanelContent {...defaultProps} labels={categorizedLabels} />)

    const goodButton = screen.getByText("Good")
    await user.click(goodButton)

    expect(defaultProps.onLabelClick).toHaveBeenCalledWith("Result - Good")
  })

  test("不正なラベル形式でも安全に処理される", () => {
    const invalidLabels = null as any

    expect(() => {
      render(<TaggingPanelContent {...defaultProps} labels={invalidLabels} />)
    }).not.toThrow()
  })

  test("空の配列でもエラーにならない", () => {
    render(
      <TaggingPanelContent
        {...defaultProps}
        teams={[]}
        actions={{}}
        labels={[]}
      />
    )

    // エラーが発生しないことを確認
    expect(screen.queryByText("Team A")).not.toBeInTheDocument()
  })
})
