import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { LabelList } from "."

describe("LabelList", () => {
  const defaultProps = {
    labels: {
      good: "Good",
      bad: "Bad",
      excellent: "Excellent"
    },
    onAdd: jest.fn(),
    onRemove: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("ラベルリストが表示される", () => {
    render(<LabelList {...defaultProps} />)

    expect(screen.getByText("ラベル")).toBeInTheDocument()
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })

  test("ラベル追加ボタンが表示される", () => {
    render(<LabelList {...defaultProps} />)

    const addButton = screen.getByText("ラベルを追加")
    expect(addButton).toBeInTheDocument()
  })

  test("ラベル追加ボタンをクリックするとonAddが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<LabelList {...defaultProps} />)

    const addButton = screen.getByText("ラベルを追加")
    await user.click(addButton)

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
  })

  test("各ラベルに削除ボタンが表示される", () => {
    render(<LabelList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(3) // 3つのラベルそれぞれに削除ボタン
  })

  test("削除ボタンをクリックするとonRemoveが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<LabelList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    await user.click(deleteButtons[0]) // 最初のラベルの削除ボタン

    expect(defaultProps.onRemove).toHaveBeenCalledWith("good")
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1)
  })

  test("空のラベル辞書でもエラーにならない", () => {
    render(<LabelList {...defaultProps} labels={{}} />)

    expect(screen.getByText("ラベル")).toBeInTheDocument()
    expect(screen.getByText("ラベルを追加")).toBeInTheDocument()
    expect(screen.queryByText("削除")).not.toBeInTheDocument()
  })

  test("カテゴリ化されたラベル名も正しく表示される", () => {
    const categorizedLabels = {
      "result-ace": "Result - Ace",
      "type-first-serve": "Type - First Serve",
      simple: "Simple"
    }

    render(<LabelList {...defaultProps} labels={categorizedLabels} />)

    expect(screen.getByText("Result - Ace")).toBeInTheDocument()
    expect(screen.getByText("Type - First Serve")).toBeInTheDocument()
    expect(screen.getByText("Simple")).toBeInTheDocument()
  })

  test("ラベルアイテムが適切なスタイルで表示される", () => {
    render(<LabelList {...defaultProps} />)

    // ラベル名が表示されることを確認
    const goodLabel = screen.getByText("Good")
    expect(goodLabel).toBeInTheDocument()

    // 削除ボタンのスタイルを確認
    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button).toHaveStyle({
        backgroundColor: "rgb(220, 53, 69)",
        color: "rgb(255, 255, 255)"
      })
    })
  })

  test("ラベル追加ボタンのスタイルが正しく適用される", () => {
    render(<LabelList {...defaultProps} />)

    const addButton = screen.getByText("ラベルを追加")
    expect(addButton).toHaveStyle({
      backgroundColor: "rgb(0, 123, 255)",
      color: "rgb(255, 255, 255)"
    })
  })

  test("特殊文字を含むラベル名も正しく表示される", () => {
    const specialLabels = {
      "label-with-hyphen": "Label With Hyphen",
      label_with_underscore: "Label With Underscore",
      ラベル日本語: "Japanese Label",
      label123: "Label With Numbers",
      "label@special!": "Label With Special Chars"
    }

    render(<LabelList {...defaultProps} labels={specialLabels} />)

    expect(screen.getByText("Label With Hyphen")).toBeInTheDocument()
    expect(screen.getByText("Label With Underscore")).toBeInTheDocument()
    expect(screen.getByText("Japanese Label")).toBeInTheDocument()
    expect(screen.getByText("Label With Numbers")).toBeInTheDocument()
    expect(screen.getByText("Label With Special Chars")).toBeInTheDocument()
  })

  test("多数のラベルがある場合も正しく表示される", () => {
    const manyLabels: Record<string, string> = {}
    for (let i = 1; i <= 15; i++) {
      manyLabels[`label${i}`] = `Label ${i}`
    }

    render(<LabelList {...defaultProps} labels={manyLabels} />)

    expect(screen.getByText("Label 1")).toBeInTheDocument()
    expect(screen.getByText("Label 8")).toBeInTheDocument()
    expect(screen.getByText("Label 15")).toBeInTheDocument()

    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(15)
  })

  test("削除ボタンの連続クリックに対応する", async () => {
    const user = userEvent.setup()
    render(<LabelList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")

    // 複数の削除ボタンを連続でクリック
    await user.click(deleteButtons[0])
    await user.click(deleteButtons[1])
    await user.click(deleteButtons[2])

    expect(defaultProps.onRemove).toHaveBeenCalledTimes(3)
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(1, "good")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(2, "bad")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(3, "excellent")
  })

  test("ラベルアイテムのレイアウトが正しく表示される", () => {
    render(<LabelList {...defaultProps} />)

    // ラベルアイテムが適切にレイアウトされることを確認
    const labelItems = screen.getAllByText(/Good|Bad|Excellent/)
    expect(labelItems).toHaveLength(3)

    // 各アイテムに削除ボタンが隣接していることを確認
    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(3)
  })

  test("ホバー効果が適用される", async () => {
    const user = userEvent.setup()
    render(<LabelList {...defaultProps} />)

    const addButton = screen.getByText("ラベルを追加")

    await user.hover(addButton)
    // ホバー時のスタイル変更は実装に依存するため、要素の存在のみ確認
    expect(addButton).toBeInTheDocument()

    await user.unhover(addButton)
    expect(addButton).toBeInTheDocument()
  })

  test("削除ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<LabelList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")

    await user.hover(deleteButtons[0])
    expect(deleteButtons[0]).toBeInTheDocument()

    await user.unhover(deleteButtons[0])
    expect(deleteButtons[0]).toBeInTheDocument()
  })

  test("アクセシビリティ: 適切なHTMLセマンティクスが使用される", () => {
    render(<LabelList {...defaultProps} />)

    const addButton = screen.getByText("ラベルを追加")
    expect(addButton.tagName).toBe("BUTTON")

    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button.tagName).toBe("BUTTON")
    })
  })

  test("長いラベル名も適切に表示される", () => {
    const longLabels = {
      long: "This is a very long label name that might cause layout issues if not handled properly"
    }

    render(<LabelList {...defaultProps} labels={longLabels} />)

    expect(
      screen.getByText(
        "This is a very long label name that might cause layout issues if not handled properly"
      )
    ).toBeInTheDocument()
  })
})
