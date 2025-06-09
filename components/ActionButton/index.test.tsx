import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { ActionButton } from "."

describe("ActionButton", () => {
  const defaultProps = {
    team: "Team A",
    action: "pass",
    isActive: false,
    onClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("アクション名が表示される", () => {
    render(<ActionButton {...defaultProps} />)

    expect(screen.getByRole("button", { name: "pass" })).toBeInTheDocument()
  })

  test("クリックするとonClickが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "pass" })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Team A", "pass")
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  test("非アクティブ状態では正しいスタイルが適用される", () => {
    render(<ActionButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "pass" })
    expect(button).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
      color: "rgb(55, 65, 81)",
      borderColor: "rgb(209, 213, 219)"
    })
  })

  test("アクティブ状態では正しいスタイルが適用される", () => {
    render(<ActionButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "pass" })
    expect(button).toHaveStyle({
      backgroundColor: "rgb(239, 68, 68)",
      color: "rgb(255, 255, 255)",
      borderColor: "rgb(239, 68, 68)"
    })
  })

  test("ホバー時にスタイルが変更される（非アクティブ）", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", { name: "pass" })

    await user.hover(button)
    expect(button).toHaveStyle({
      backgroundColor: "rgb(248, 250, 252)",
      borderColor: "rgb(148, 163, 184)"
    })

    await user.unhover(button)
    expect(button).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
      borderColor: "rgb(209, 213, 219)"
    })
  })

  test("ホバー時にスタイルが変更される（アクティブ）", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", { name: "pass" })

    await user.hover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#dc2626"
    })

    await user.unhover(button)
    expect(button).toHaveStyle({
      backgroundColor: "#ef4444"
    })
  })

  test("異なるチームとアクションの組み合わせで動作する", async () => {
    const user = userEvent.setup()
    const props = {
      team: "Team B",
      action: "shoot",
      isActive: true,
      onClick: jest.fn()
    }

    render(<ActionButton {...props} />)

    const button = screen.getByRole("button", { name: "shoot" })
    await user.click(button)

    expect(props.onClick).toHaveBeenCalledWith("Team B", "shoot")
  })

  test("複数回クリックしても正しく動作する", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} />)

    const button = screen.getByRole("button", { name: "pass" })

    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledTimes(3)
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(1, "Team A", "pass")
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(2, "Team A", "pass")
    expect(defaultProps.onClick).toHaveBeenNthCalledWith(3, "Team A", "pass")
  })

  test("長いアクション名でも正しく表示される", () => {
    const props = {
      ...defaultProps,
      action: "very-long-action-name-test"
    }

    render(<ActionButton {...props} />)

    expect(
      screen.getByRole("button", { name: "very-long-action-name-test" })
    ).toBeInTheDocument()
  })

  test("特殊文字を含むアクション名でも動作する", async () => {
    const user = userEvent.setup()
    const props = {
      ...defaultProps,
      action: "action-with-特殊文字-123"
    }

    render(<ActionButton {...props} />)

    const button = screen.getByRole("button", {
      name: "action-with-特殊文字-123"
    })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith(
      "Team A",
      "action-with-特殊文字-123"
    )
  })
})
