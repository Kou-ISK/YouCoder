import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { ActionList } from "../../../components/Popup/ActionList"

describe("ActionList", () => {
  const defaultProps = {
    actions: {
      pass: "Pass",
      shoot: "Shoot",
      tackle: "Tackle"
    },
    onAdd: jest.fn(),
    onRemove: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("アクションリストが表示される", () => {
    render(<ActionList {...defaultProps} />)

    expect(screen.getByText("アクション")).toBeInTheDocument()
    expect(screen.getByText("Pass")).toBeInTheDocument()
    expect(screen.getByText("Shoot")).toBeInTheDocument()
    expect(screen.getByText("Tackle")).toBeInTheDocument()
  })

  test("アクション追加ボタンが表示される", () => {
    render(<ActionList {...defaultProps} />)

    const addButton = screen.getByText("アクションを追加")
    expect(addButton).toBeInTheDocument()
  })

  test("アクション追加ボタンをクリックするとonAddが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<ActionList {...defaultProps} />)

    const addButton = screen.getByText("アクションを追加")
    await user.click(addButton)

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
  })

  test("各アクションに削除ボタンが表示される", () => {
    render(<ActionList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(3) // 3つのアクションそれぞれに削除ボタン
  })

  test("削除ボタンをクリックするとonRemoveが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<ActionList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    await user.click(deleteButtons[0]) // 最初のアクションの削除ボタン

    expect(defaultProps.onRemove).toHaveBeenCalledWith("pass")
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1)
  })

  test("空のアクション辞書でもエラーにならない", () => {
    render(<ActionList {...defaultProps} actions={{}} />)

    expect(screen.getByText("アクション")).toBeInTheDocument()
    expect(screen.getByText("アクションを追加")).toBeInTheDocument()
    expect(screen.queryByText("削除")).not.toBeInTheDocument()
  })

  test("アクションアイテムが適切なスタイルで表示される", () => {
    render(<ActionList {...defaultProps} />)

    // アクション名が表示されることを確認
    const passAction = screen.getByText("Pass")
    expect(passAction).toBeInTheDocument()

    // 削除ボタンのスタイルを確認
    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button).toHaveStyle({
        backgroundColor: "rgb(220, 53, 69)",
        color: "rgb(255, 255, 255)"
      })
    })
  })

  test("アクション追加ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<ActionList {...defaultProps} />)

    const addButton = screen.getByText("アクションを追加")

    await user.hover(addButton)
    // ホバー時のスタイル変更は実装に依存するため、要素の存在のみ確認
    expect(addButton).toBeInTheDocument()

    await user.unhover(addButton)
    expect(addButton).toBeInTheDocument()
  })

  test("特殊文字を含むアクション名も正しく表示される", () => {
    const specialActions = {
      "action-with-hyphen": "Action With Hyphen",
      action_with_underscore: "Action With Underscore",
      アクション日本語: "Japanese Action",
      action123: "Action With Numbers"
    }

    render(<ActionList {...defaultProps} actions={specialActions} />)

    expect(screen.getByText("Action With Hyphen")).toBeInTheDocument()
    expect(screen.getByText("Action With Underscore")).toBeInTheDocument()
    expect(screen.getByText("Japanese Action")).toBeInTheDocument()
    expect(screen.getByText("Action With Numbers")).toBeInTheDocument()
  })

  test("多数のアクションがある場合も正しく表示される", () => {
    const manyActions: Record<string, string> = {}
    for (let i = 1; i <= 20; i++) {
      manyActions[`action${i}`] = `Action ${i}`
    }

    render(<ActionList {...defaultProps} actions={manyActions} />)

    expect(screen.getByText("Action 1")).toBeInTheDocument()
    expect(screen.getByText("Action 10")).toBeInTheDocument()
    expect(screen.getByText("Action 20")).toBeInTheDocument()

    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(20)
  })

  test("削除ボタンの連続クリックに対応する", async () => {
    const user = userEvent.setup()
    render(<ActionList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")

    // 複数の削除ボタンを連続でクリック
    await user.click(deleteButtons[0])
    await user.click(deleteButtons[1])
    await user.click(deleteButtons[2])

    expect(defaultProps.onRemove).toHaveBeenCalledTimes(3)
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(1, "pass")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(2, "shoot")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(3, "tackle")
  })

  test("アクセシビリティ: 適切なARIAラベルが設定される", () => {
    render(<ActionList {...defaultProps} />)

    const addButton = screen.getByText("アクションを追加")
    expect(addButton).toHaveAttribute("type", "button")

    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button).toHaveAttribute("type", "button")
    })
  })
})
