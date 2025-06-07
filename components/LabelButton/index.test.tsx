import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { LabelButton } from "."

describe("LabelButton", () => {
  const defaultProps = {
    label: "Good",
    isActive: false,
    isDisabled: false,
    onClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("ラベル名が表示される", () => {
    render(<LabelButton {...defaultProps} />)

    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument()
  })

  test("クリックするとonClickが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "Good" })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Good")
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  test("非アクティブ状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "Good" })
    expect(button).toHaveStyle({
      backgroundColor: "#ffffff",
      color: "#374151",
      borderColor: "#d1d5db"
    })
  })

  test("アクティブ状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "Good" })
    expect(button).toHaveStyle({
      backgroundColor: "rgb(59, 130, 246)",
      color: "rgb(255, 255, 255)",
      borderColor: "rgb(59, 130, 246)"
    })
  })

  test("無効化状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Good" })
    expect(button).toBeDisabled()
    expect(button).toHaveStyle({
      cursor: "not-allowed",
      opacity: "0.5"
    })
  })

  test("無効化されている場合はクリックできない", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Good" })
    await user.click(button)

    expect(defaultProps.onClick).not.toHaveBeenCalled()
  })

  test("ホバー時にスタイルが変更される（非アクティブ）", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "Good" })

    await user.hover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#f8fafc",
      borderColor: "#94a3b8"
    })

    await user.unhover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#ffffff",
      borderColor: "#d1d5db"
    })
  })

  test("ホバー時にスタイルが変更される（アクティブ）", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "Good" })

    await user.hover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#2563eb"
    })

    await user.unhover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#3b82f6"
    })
  })

  test("無効化時はホバー効果が適用されない", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Good" })

    await user.hover(button)
    // 無効化時は背景色が変わらない
    expect(button).toHaveStyle({
      backgroundColor: "#ffffff"
    })
  })

  test("複数回クリックしても正しく動作する", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "Good" })

    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledTimes(3)
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(1, "Good")
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(2, "Good")
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(3, "Good")
  })

  test("長いラベル名でも正しく表示される", () => {
    const props = {
      ...defaultProps,
      label: "very-long-label-name-for-testing-purposes"
    }

    render(<LabelButton {...props} />)

    const button = screen.getByRole("button", {
      name: "very-long-label-name-for-testing-purposes"
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveStyle({
      whiteSpace: "nowrap"
    })
  })

  test("特殊文字を含むラベル名でも動作する", async () => {
    const user = userEvent.setup()
    const props = {
      ...defaultProps,
      label: "ラベル-with-特殊文字-123"
    }

    render(<LabelButton {...props} />)

    const button = screen.getByRole("button", {
      name: "ラベル-with-特殊文字-123"
    })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith(
      "ラベル-with-特殊文字-123"
    )
  })

  test("カテゴリ付きラベルでも正しく動作する", async () => {
    const user = userEvent.setup()
    const props = {
      ...defaultProps,
      label: "Result - Good"
    }

    render(<LabelButton {...props} />)

    const button = screen.getByRole("button", { name: "Result - Good" })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Result - Good")
  })

  test("アクティブかつ無効化状態でも正しく表示される", () => {
    render(<LabelButton {...defaultProps} isActive={true} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Good" })
    expect(button).toBeDisabled()
    expect(button).toHaveStyle({
      opacity: "0.5",
      cursor: "not-allowed"
    })
  })
})
