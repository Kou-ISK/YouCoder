import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { Modal } from "."

describe("Modal", () => {
  const mockOnClose = jest.fn()
  const mockOnInputChange = jest.fn()
  const mockOnSubmit = jest.fn()

  const defaultProps = {
    isOpen: true,
    inputValue: "",
    modalType: "team" as const,
    onInputChange: mockOnInputChange,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("モーダルが適切なタイトルで表示される", () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "チームを追加" })
    ).toBeInTheDocument()
  })

  it("モーダルが閉じた状態の時、何も表示されない", () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("フォームの入力が適切に処理される", async () => {
    render(<Modal {...defaultProps} />)
    const input = screen.getByRole("textbox")

    await act(async () => {
      fireEvent.change(input, { target: { value: "テストチーム" } })
    })

    expect(mockOnInputChange).toHaveBeenCalledWith("テストチーム")
  })

  it("フォーム送信が適切に処理される", () => {
    render(<Modal {...defaultProps} inputValue="テストチーム" />)
    const submitButton = screen.getByRole("button", { name: "追加" })
    fireEvent.click(submitButton)
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
  })

  it("空の入力値でフォームを送信しても処理されない", () => {
    render(<Modal {...defaultProps} inputValue="" />)
    const submitButton = screen.getByRole("button", { name: "追加" })
    fireEvent.click(submitButton)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it("キャンセルボタンをクリックするとモーダルが閉じる", () => {
    render(<Modal {...defaultProps} />)
    const cancelButton = screen.getByRole("button", { name: "キャンセル" })
    fireEvent.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("ESCキーを押すとモーダルが閉じる", () => {
    render(<Modal {...defaultProps} />)
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  describe("カテゴリ付きラベルモーダル", () => {
    const categoryProps = {
      ...defaultProps,
      modalType: "addLabel" as const
    }

    it("カテゴリとラベルの入力フィールドが表示される", () => {
      render(<Modal {...categoryProps} />)
      const inputs = screen.getAllByRole("textbox")
      expect(inputs).toHaveLength(2)
      expect(screen.getByLabelText("カテゴリ:")).toBeInTheDocument()
      expect(screen.getByLabelText("ラベル:")).toBeInTheDocument()
    })

    it("カテゴリとラベルの両方の入力を処理する", async () => {
      const user = userEvent.setup()
      render(<Modal {...categoryProps} inputValue="forehand" />)

      await act(async () => {
        const categoryInput = screen.getByLabelText("カテゴリ:")
        await user.clear(categoryInput)
        await user.type(categoryInput, "Shot Type")
      })

      await act(async () => {
        const submitButton = screen.getByRole("button", { name: "追加" })
        fireEvent.click(submitButton)
      })

      expect(mockOnSubmit).toHaveBeenCalledWith("Shot Type")
    })
  })
})
