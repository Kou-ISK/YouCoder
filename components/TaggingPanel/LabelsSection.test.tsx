import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { LabelsSection } from "./LabelsSection"

// LabelButtonコンポーネントのモック
jest.mock("~components/LabelButton", () => ({
  LabelButton: ({
    label,
    isActive,
    onClick
  }: {
    label: string
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      data-testid={`label-button-${label}`}
      className={isActive ? "active" : ""}>
      {label}
    </button>
  )
}))

describe("LabelsSection", () => {
  const mockOnLabelClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("配列形式のラベルを表示する", () => {
    const labels = ["Good", "Bad", "Excellent"]
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })

  test("カテゴリ形式のラベルを表示する", () => {
    const labels = {
      Result: ["Good", "Bad"],
      Distance: ["Short", "Long"]
    }
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // カテゴリヘッダーの確認
    expect(screen.getByText("Result")).toBeInTheDocument()
    expect(screen.getByText("Distance")).toBeInTheDocument()

    // ラベルボタンの確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
    expect(screen.getByText("Long")).toBeInTheDocument()
  })

  test("一般カテゴリではカテゴリ名を表示しない", () => {
    const labels = {
      一般: ["Basic", "Simple"]
    }
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    expect(screen.queryByText("一般")).not.toBeInTheDocument()
    expect(screen.getByText("Basic")).toBeInTheDocument()
    expect(screen.getByText("Simple")).toBeInTheDocument()
  })

  test("ラベルクリック時に正しい値で呼び出される", async () => {
    const user = userEvent.setup()
    const labels = {
      Result: ["Good"],
      一般: ["Basic"]
    }
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // カテゴリ付きラベルのクリック
    await user.click(screen.getByText("Good"))
    expect(mockOnLabelClick).toHaveBeenCalledWith("Result - Good")

    // 一般カテゴリのラベルのクリック
    await user.click(screen.getByText("Basic"))
    expect(mockOnLabelClick).toHaveBeenCalledWith("Basic")
  })

  test("空のラベルでは何も表示しない", () => {
    const labels: string[] = []
    const activeLabels = new Set<string>()

    const { container } = render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // 空のラベルの場合はnullが返される
    expect(container.firstChild).toBeNull()
  })

  test("不正なラベル形式でエラーにならない", () => {
    const labels = null as any
    const activeLabels = new Set<string>()

    expect(() => {
      render(
        <LabelsSection
          labels={labels}
          activeLabels={activeLabels}
          onLabelClick={mockOnLabelClick}
        />
      )
    }).not.toThrow()
  })

  test("適切なアクセシビリティ属性が設定されている", () => {
    const labels = {
      Result: ["Good", "Bad"]
    }
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    expect(
      screen.getByRole("group", { name: "Resultカテゴリのラベル" })
    ).toBeInTheDocument()
  })
})
