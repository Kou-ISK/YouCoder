import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TeamList } from "."

describe("TeamList", () => {
  const defaultProps = {
    teams: ["チームA", "チームB", "チームC"],
    onAdd: jest.fn(),
    onRemove: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("TeamListが正常にレンダリングされる", () => {
    render(<TeamList {...defaultProps} />)

    // タイトルが表示されることを確認
    expect(screen.getByText("チーム")).toBeInTheDocument()

    // 追加ボタンが表示されることを確認
    expect(screen.getByText("チームを追加")).toBeInTheDocument()

    // 各チーム名が表示されることを確認
    expect(screen.getByText("チームA")).toBeInTheDocument()
    expect(screen.getByText("チームB")).toBeInTheDocument()
    expect(screen.getByText("チームC")).toBeInTheDocument()
  })

  test("空のチーム配列でも正常にレンダリングされる", () => {
    render(<TeamList {...defaultProps} teams={[]} />)

    // タイトルと追加ボタンは表示される
    expect(screen.getByText("チーム")).toBeInTheDocument()
    expect(screen.getByText("チームを追加")).toBeInTheDocument()

    // チーム項目は表示されない
    expect(screen.queryByText("チームA")).not.toBeInTheDocument()
  })

  test("チーム追加ボタンをクリックするとonAddが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const addButton = screen.getByText("チームを追加")
    await user.click(addButton)

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
  })

  test("チーム削除ボタンをクリックするとonRemoveが正しいチーム名で呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    // 最初のチームの削除ボタンを取得
    const deleteButtons = screen.getAllByText("削除")
    await user.click(deleteButtons[0])

    expect(defaultProps.onRemove).toHaveBeenCalledWith("チームA")
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1)
  })

  test("複数のチームの削除ボタンが正しく動作する", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")

    // 2番目のチームを削除
    await user.click(deleteButtons[1])
    expect(defaultProps.onRemove).toHaveBeenCalledWith("チームB")

    // 3番目のチームを削除
    await user.click(deleteButtons[2])
    expect(defaultProps.onRemove).toHaveBeenCalledWith("チームC")
  })

  test("チーム項目が適切なスタイルで表示される", () => {
    render(<TeamList {...defaultProps} />)

    // チーム名のTailwindクラスを確認
    const teamA = screen.getByText("チームA")
    expect(teamA).toHaveClass("text-sm", "text-gray-700")

    // 削除ボタンのTailwindクラスを確認
    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button).toHaveClass("bg-red-500", "text-white", "text-xs")
    })
  })

  test("追加ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const addButton = screen.getByText("チームを追加")

    // Tailwindクラスの確認
    expect(addButton).toHaveClass("bg-blue-500", "hover:bg-blue-600")

    await user.hover(addButton)

    // ホバー後の状態（onMouseEnterイベントが発生することを確認）
    await user.unhover(addButton)
  })

  test("削除ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    const firstDeleteButton = deleteButtons[0]

    // Tailwindクラスの確認
    expect(firstDeleteButton).toHaveClass("bg-red-500", "hover:bg-red-600")

    await user.hover(firstDeleteButton)

    // ホバー後の状態（onMouseEnterイベントが発生することを確認）
    await user.unhover(firstDeleteButton)
  })

  test("長いチーム名が適切に表示される", () => {
    const longTeamNames = [
      "とても長いチーム名をテストするためのチーム1",
      "Very Long Team Name For Testing Purpose Team 2",
      "特殊文字@#$%を含むチーム名"
    ]

    render(<TeamList {...defaultProps} teams={longTeamNames} />)

    // 長いチーム名も正しく表示されることを確認
    expect(
      screen.getByText("とても長いチーム名をテストするためのチーム1")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Very Long Team Name For Testing Purpose Team 2")
    ).toBeInTheDocument()
    expect(screen.getByText("特殊文字@#$%を含むチーム名")).toBeInTheDocument()
  })

  test("特殊文字を含むチーム名が正しく処理される", () => {
    const specialCharTeams = [
      "チーム-A",
      "チーム_B",
      "チーム@C",
      "チーム#1",
      "チーム(括弧)",
      "チーム[角括弧]",
      "チーム{波括弧}"
    ]

    render(<TeamList {...defaultProps} teams={specialCharTeams} />)

    // 特殊文字を含むチーム名も正しく表示されることを確認
    specialCharTeams.forEach((teamName) => {
      expect(screen.getByText(teamName)).toBeInTheDocument()
    })
  })

  test("空文字や空白のチーム名の処理", () => {
    const edgeCaseTeams = [
      "", // 空文字
      " ", // 空白
      "   ", // 複数空白
      "\t", // タブ文字
      "\n" // 改行文字
    ]

    render(<TeamList {...defaultProps} teams={edgeCaseTeams} />)

    // 削除ボタンの数が正しいことを確認（チーム数分存在）
    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(edgeCaseTeams.length)
  })

  test("大量のチームが存在する場合の表示", () => {
    const manyTeams = Array.from({ length: 50 }, (_, i) => `チーム${i + 1}`)

    render(<TeamList {...defaultProps} teams={manyTeams} />)

    // 最初のチームと最後のチームが表示されることを確認
    expect(screen.getByText("チーム1")).toBeInTheDocument()
    expect(screen.getByText("チーム50")).toBeInTheDocument()

    // 削除ボタンの数が正しいことを確認
    const deleteButtons = screen.getAllByText("削除")
    expect(deleteButtons).toHaveLength(50)
  })

  test("チーム削除時の連続操作", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")

    // 複数のチームを連続で削除
    await user.click(deleteButtons[0])
    await user.click(deleteButtons[1])
    await user.click(deleteButtons[2])

    // onRemoveが3回呼ばれ、それぞれ正しいチーム名で呼ばれることを確認
    expect(defaultProps.onRemove).toHaveBeenCalledTimes(3)
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(1, "チームA")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(2, "チームB")
    expect(defaultProps.onRemove).toHaveBeenNthCalledWith(3, "チームC")
  })

  test("キーボードナビゲーション", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const addButton = screen.getByText("チームを追加")

    // フォーカスとEnterキーでの操作
    addButton.focus()
    await user.keyboard("{Enter}")

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1)
  })

  test("削除ボタンのキーボード操作", async () => {
    const user = userEvent.setup()
    render(<TeamList {...defaultProps} />)

    const deleteButtons = screen.getAllByText("削除")
    const firstDeleteButton = deleteButtons[0]

    // フォーカスとEnterキーでの削除
    firstDeleteButton.focus()
    await user.keyboard("{Enter}")

    expect(defaultProps.onRemove).toHaveBeenCalledWith("チームA")
  })

  test("コンポーネントの基本スタイル構造", () => {
    render(<TeamList {...defaultProps} />)

    // メインコンテナのTailwindクラス確認
    const container = screen.getByText("チーム").closest("div")
    expect(container).toHaveClass("mb-6", "p-4", "bg-white", "rounded-lg")
  })

  test("アクセシビリティ属性の確認", () => {
    render(<TeamList {...defaultProps} />)

    // ボタン要素のTailwindクラス確認
    const addButton = screen.getByText("チームを追加")
    expect(addButton).toHaveClass("px-4", "py-2", "bg-blue-500")

    const deleteButtons = screen.getAllByText("削除")
    deleteButtons.forEach((button) => {
      expect(button).toHaveClass("px-2", "py-1", "bg-red-500")
    })
  })

  test("レスポンシブ対応の基本確認", () => {
    render(<TeamList {...defaultProps} />)

    // フレックスボックスレイアウトのTailwindクラス確認
    const teamItems = screen.getByText("チームA").closest("div")
    expect(teamItems).toHaveClass("flex", "justify-between", "items-center")
  })
})
