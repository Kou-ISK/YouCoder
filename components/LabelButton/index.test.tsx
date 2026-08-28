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

    expect(
      screen.getByRole("button", { name: "Goodラベル (未選択)" })
    ).toBeInTheDocument()
  })

  test("クリックするとonClickが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Good")
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  test("非アクティブ状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })

    // TailwindCSSクラスの存在を確認
    expect(button).toHaveClass("bg-white", "text-gray-600", "border-gray-200")
    expect(button).not.toHaveClass("from-green-500")
  })

  test("アクティブ状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (選択中)" })

    // TailwindCSSクラスの存在を確認
    expect(button).toHaveClass(
      "bg-gradient-to-r",
      "from-green-500",
      "to-emerald-500",
      "text-white",
      "border-green-400"
    )
    expect(button).not.toHaveClass("bg-white")
  })

  test("無効化状態では正しいスタイルが適用される", () => {
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })
    expect(button).toBeDisabled()

    // 無効化状態のCSSクラスの存在を確認
    expect(button).toHaveClass("opacity-50", "cursor-not-allowed")
  })

  test("無効化されている場合はクリックできない", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })
    await user.click(button)

    expect(defaultProps.onClick).not.toHaveBeenCalled()
  })

  test("ホバー時にスタイルクラスが適用される（非アクティブ）", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })

    // ホバークラスの存在を確認
    expect(button).toHaveClass(
      "hover:bg-gray-50",
      "hover:border-gray-300",
      "hover:text-gray-700"
    )
    expect(button).toHaveClass("transition-all", "duration-200")
  })

  test("ホバー時にスタイルクラスが適用される（アクティブ）", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (選択中)" })

    // ホバークラスの存在を確認
    expect(button).toHaveClass("hover:from-green-600", "hover:to-emerald-600")
    expect(button).toHaveClass("transition-all", "duration-200")
  })

  test("無効化時は適切なクラスが適用される", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })

    // 無効化時のクラスが適用されていることを確認
    expect(button).toHaveClass("opacity-50", "cursor-not-allowed")
    expect(button).toBeDisabled()
  })

  test("複数回クリックしても正しく動作する", async () => {
    const user = userEvent.setup()
    render(<LabelButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "Goodラベル (未選択)" })

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
      name: "very-long-label-name-for-testing-purposesラベル (未選択)"
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
      name: "ラベル-with-特殊文字-123ラベル (未選択)"
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

    const button = screen.getByRole("button", {
      name: "Result - Goodラベル (未選択)"
    })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Result - Good")
  })

  test("アクティブかつ無効化状態でも正しく表示される", () => {
    render(<LabelButton {...defaultProps} isActive={true} isDisabled={true} />)

    const button = screen.getByRole("button", { name: "Goodラベル (選択中)" })
    expect(button).toBeDisabled()

    // 無効化状態のCSSクラスが適用されていることを確認
    expect(button).toHaveClass("opacity-50", "cursor-not-allowed")
  })
})
