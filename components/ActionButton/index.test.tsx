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

    expect(
      screen.getByRole("button", {
        name: "Team Aチームのpassアクション (非アクティブ)"
      })
    ).toBeInTheDocument()
    expect(screen.getByText("pass")).toBeInTheDocument()
  })

  test("クリックするとonClickが正しい引数で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (非アクティブ)"
    })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith("Team A", "pass")
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  test("非アクティブ状態では正しいスタイルが適用される", () => {
    render(<ActionButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (非アクティブ)"
    })

    // TailwindCSSクラスの存在を確認
    expect(button).toHaveClass("bg-white", "text-gray-700", "border-gray-300")
    expect(button).not.toHaveClass("bg-red-500")
  })

  test("アクティブ状態では正しいスタイルが適用される", () => {
    render(<ActionButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (アクティブ)"
    })

    // TailwindCSSクラスの存在を確認
    expect(button).toHaveClass("bg-red-500", "text-white", "border-red-500")
    expect(button).not.toHaveClass("bg-white")
  })

  test("ホバー時にスタイルクラスが適用される（非アクティブ）", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} isActive={false} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (非アクティブ)"
    })

    // 基本クラスが存在することを確認
    expect(button).toHaveClass("hover:bg-gray-50", "hover:border-gray-400")
    expect(button).toHaveClass("transition-all", "duration-150")
  })

  test("ホバー時にスタイルクラスが適用される（アクティブ）", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} isActive={true} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (アクティブ)"
    })

    // 基本クラスが存在することを確認
    expect(button).toHaveClass("hover:bg-red-600")
    expect(button).toHaveClass("transition-all", "duration-150")
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

    const button = screen.getByRole("button", {
      name: "Team Bチームのshootアクション (アクティブ)"
    })
    await user.click(button)

    expect(props.onClick).toHaveBeenCalledWith("Team B", "shoot")
  })

  test("複数回クリックしても正しく動作する", async () => {
    const user = userEvent.setup()
    render(<ActionButton {...defaultProps} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのpassアクション (非アクティブ)"
    })

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
      screen.getByRole("button", {
        name: "Team Aチームのvery-long-action-name-testアクション (非アクティブ)"
      })
    ).toBeInTheDocument()
    expect(screen.getByText("very-long-action-name-test")).toBeInTheDocument()
  })

  test("特殊文字を含むアクション名でも動作する", async () => {
    const user = userEvent.setup()
    const props = {
      ...defaultProps,
      action: "action-with-特殊文字-123"
    }

    render(<ActionButton {...props} />)

    const button = screen.getByRole("button", {
      name: "Team Aチームのaction-with-特殊文字-123アクション (非アクティブ)"
    })
    await user.click(button)

    expect(defaultProps.onClick).toHaveBeenCalledWith(
      "Team A",
      "action-with-特殊文字-123"
    )
  })
})
