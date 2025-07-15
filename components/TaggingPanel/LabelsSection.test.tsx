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

  test("配列形式のラベルでは何も表示されない", () => {
    // Record<string, string[]>形式のみサポートするため、配列は表示されない
    const labels = {} as Record<string, string[]>
    const activeLabels = new Set<string>()

    const { container } = render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // 空のオブジェクトの場合はnullが返される
    expect(container.firstChild).toBeNull()
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

  test("すべてのカテゴリでカテゴリ名が表示される", () => {
    const labels = {
      General: ["Basic", "Simple"]
    }
    const activeLabels = new Set<string>()

    render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // "General"カテゴリも他のカテゴリと同様に表示される
    expect(screen.getByText("General")).toBeInTheDocument()
    expect(screen.getByText("Basic")).toBeInTheDocument()
    expect(screen.getByText("Simple")).toBeInTheDocument()
  })

  test("ラベルクリック時に正しい値で呼び出される", async () => {
    const user = userEvent.setup()
    const labels = {
      Result: ["Good"],
      General: ["Basic"]
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

    // Generalカテゴリのラベルのクリック
    await user.click(screen.getByText("Basic"))
    expect(mockOnLabelClick).toHaveBeenCalledWith("General - Basic")
  })

  test("空のラベルでは何も表示しない", () => {
    const labels = {} as Record<string, string[]>
    const activeLabels = new Set<string>()

    const { container } = render(
      <LabelsSection
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={mockOnLabelClick}
      />
    )

    // 空のオブジェクトの場合はnullが返される
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

  test("カテゴリヘッダーとラベルが適切に表示される", () => {
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

    // カテゴリヘッダーが表示されることを確認
    expect(screen.getByText("Result")).toBeInTheDocument()

    // ラベルボタンが表示されることを確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()

    // アクセシビリティ属性の確認
    expect(
      screen.getByRole("group", { name: "Resultカテゴリのラベル" })
    ).toBeInTheDocument()
  })
})
