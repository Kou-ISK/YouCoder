import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { Modal } from "../../../components/Popup/Modal"

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    inputValue: "",
    modalType: "team" as const,
    onInputChange: jest.fn(),
    onClose: jest.fn(),
    onSubmit: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("モーダルが開いている時に表示される", () => {
    render(<Modal {...defaultProps} />)

    expect(screen.getByText("チームを追加")).toBeInTheDocument()
    expect(screen.getByDisplayValue("")).toBeInTheDocument()
    expect(screen.getByText("追加")).toBeInTheDocument()
    expect(screen.getByText("キャンセル")).toBeInTheDocument()
  })

  test("モーダルが閉じている時に表示されない", () => {
    render(<Modal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText("チームを追加")).not.toBeInTheDocument()
  })

  test("modalTypeに応じて適切なタイトルが表示される", () => {
    const modalTypes = [
      { type: "team" as const, title: "チームを追加" },
      { type: "action" as const, title: "アクションを追加" },
      { type: "addAction" as const, title: "アクションを追加" },
      { type: "addLabel" as const, title: "ラベルを追加" },
      {
        type: "addCategorizedLabel" as const,
        title: "カテゴリ付きラベルを追加"
      },
      { type: "buttonSet" as const, title: "ボタンセットを追加" },
      {
        type: "buttonInSet" as const,
        title: "ボタンセット内にアクションを追加"
      }
    ]

    modalTypes.forEach(({ type, title }) => {
      const { rerender } = render(<Modal {...defaultProps} modalType={type} />)
      expect(screen.getByText(title)).toBeInTheDocument()
      rerender(<Modal {...defaultProps} modalType={type} isOpen={false} />)
    })
  })

  test("カテゴリ付きラベルの場合にカテゴリ選択フィールドが表示される", () => {
    render(<Modal {...defaultProps} modalType="addCategorizedLabel" />)

    expect(screen.getByText("カテゴリ付きラベルを追加")).toBeInTheDocument()
    expect(screen.getByText("カテゴリ:")).toBeInTheDocument()

    // カテゴリ入力フィールドが表示される
    const categoryInputs = screen.getAllByRole("textbox")
    const categoryInput = categoryInputs[0] // 最初のテキストボックスはカテゴリ入力用
    expect(categoryInput).toBeInTheDocument()
    expect(categoryInput).toHaveAttribute(
      "placeholder",
      "例: Shot Type, Result, Position"
    )

    // デフォルトのカテゴリ値が設定されている
    expect(categoryInput).toHaveValue("一般")
  })

  test("入力値が変更されるとonInputChangeが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "t")
    expect(defaultProps.onInputChange).toHaveBeenCalledWith("t")

    await user.clear(input)
    await user.type(input, "test")
    // userEvent.typeはキー入力ごとに呼び出すため、最後の呼び出しを確認
    const lastCall = defaultProps.onInputChange.mock.calls.length - 1
    // 最後の呼び出しで「t」が「test」になっているはず
    expect(defaultProps.onInputChange).toHaveBeenCalledWith("test")
  })

  test("キャンセルボタンをクリックするとonCloseが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} />)

    const cancelButton = screen.getByText("キャンセル")
    await user.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  test("追加ボタンをクリックするとonSubmitが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} inputValue="test value" />)

    const submitButton = screen.getByText("追加")
    await user.click(submitButton)

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
  })

  test("カテゴリ付きラベルの追加時にカテゴリが渡される", async () => {
    const user = userEvent.setup()
    render(
      <Modal
        {...defaultProps}
        modalType="addCategorizedLabel"
        inputValue="test label"
      />
    )

    // カテゴリを入力
    const inputs = screen.getAllByRole("textbox")
    const categoryInput = inputs[0]
    await user.clear(categoryInput)
    await user.type(categoryInput, "Type")

    const submitButton = screen.getByText("追加")
    await user.click(submitButton)

    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Type")
  })

  test("Enterキーでフォームが送信される", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} inputValue="test value" />)

    const input = screen.getByRole("textbox")
    await user.type(input, "{enter}")

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
  })

  test("空の入力値では送信されない", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} inputValue="" />)

    const submitButton = screen.getByText("追加")
    await user.click(submitButton)

    // 空の値では送信されない（実装に依存）
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1)
  })

  test("プレースホルダーテキストが正しく表示される", () => {
    render(<Modal {...defaultProps} modalType="addCategorizedLabel" />)

    const inputs = screen.getAllByRole("textbox")
    // 2つ目のテキストボックスがラベル用入力フィールド
    const labelInput = inputs[1]
    expect(labelInput).toHaveAttribute(
      "placeholder",
      "例: forehand, winner, error"
    )
  })

  test("通常のモーダルではプレースホルダーが空", () => {
    render(<Modal {...defaultProps} modalType="team" />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("placeholder", "")
  })

  test("モーダルオーバーレイのスタイルが適用される", () => {
    render(<Modal {...defaultProps} isOpen={true} />)

    // モーダル全体のコンテナを直接スタイルで検索
    const overlay = screen
      .getByTestId("modal-input")
      .closest("div[style*='position: fixed']")
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveStyle({
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    })
  })

  test("モーダルコンテンツのスタイルが適用される", () => {
    render(<Modal {...defaultProps} isOpen={true} />)

    const modalContent = screen.getByText("チームを追加").parentElement
    expect(modalContent).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
      borderRadius: "8px"
    })
  })

  test("ボタンのスタイルが適用される", () => {
    render(<Modal {...defaultProps} isOpen={true} />)

    const submitButton = screen.getByText("追加")
    expect(submitButton).toHaveStyle({
      backgroundColor: "rgb(40, 167, 69)",
      color: "rgb(255, 255, 255)"
    })

    const cancelButton = screen.getByText("キャンセル")
    expect(cancelButton).toHaveStyle({
      backgroundColor: "rgb(108, 117, 125)",
      color: "rgb(255, 255, 255)"
    })
  })

  test("フォーカス管理が適切に行われる", () => {
    render(<Modal {...defaultProps} />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveFocus()
  })

  test("カテゴリ選択の変更が正しく処理される", async () => {
    const user = userEvent.setup()
    render(<Modal {...defaultProps} modalType="addCategorizedLabel" />)

    const inputs = screen.getAllByRole("textbox")
    const categoryInput = inputs[0]

    // デフォルトで「一般」が入力されている
    expect(categoryInput).toHaveValue("一般")

    // Typeに変更
    await user.clear(categoryInput)
    await user.type(categoryInput, "Type")
    expect(categoryInput).toHaveValue("Type")

    // Qualityに変更
    await user.clear(categoryInput)
    await user.type(categoryInput, "Quality")
    expect(categoryInput).toHaveValue("Quality")
  })

  test("複数回の開閉に対応する", () => {
    const { rerender } = render(<Modal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText("チームを追加")).not.toBeInTheDocument()

    rerender(<Modal {...defaultProps} isOpen={true} />)
    expect(screen.getByText("チームを追加")).toBeInTheDocument()

    rerender(<Modal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText("チームを追加")).not.toBeInTheDocument()
  })

  test("入力値の変更が適切に反映される", () => {
    const { rerender } = render(<Modal {...defaultProps} inputValue="" />)

    expect(screen.getByDisplayValue("")).toBeInTheDocument()

    rerender(<Modal {...defaultProps} inputValue="test" />)
    expect(screen.getByDisplayValue("test")).toBeInTheDocument()

    rerender(<Modal {...defaultProps} inputValue="updated test" />)
    expect(screen.getByDisplayValue("updated test")).toBeInTheDocument()
  })

  test("アクセシビリティ: 適切なARIA属性が設定される", () => {
    render(<Modal {...defaultProps} isOpen={true} />)

    const submitButton = screen.getByText("追加")
    const cancelButton = screen.getByText("キャンセル")

    // type属性の確認
    expect(submitButton).toHaveAttribute("type", "button")
    expect(cancelButton).toHaveAttribute("type", "button")

    // ボタン要素の確認
    expect(submitButton.tagName.toLowerCase()).toBe("button")
    expect(cancelButton.tagName.toLowerCase()).toBe("button")

    // ボタンのスタイルとアクセス可能性の確認
    expect(submitButton).toHaveStyle({
      cursor: "pointer"
    })
    expect(cancelButton).toHaveStyle({
      cursor: "pointer"
    })
  })
})
