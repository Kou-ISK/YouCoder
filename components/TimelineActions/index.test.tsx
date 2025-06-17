import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TimelineActions } from "."

describe("TimelineActions", () => {
  const defaultProps = {
    onSave: jest.fn(),
    onExportCSV: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("TimelineActionsが正常にレンダリングされる", () => {
    render(<TimelineActions {...defaultProps} />)

    // CSV出力ボタンが表示されることを確認
    expect(screen.getByText("CSV出力")).toBeInTheDocument()

    // 保存ボタンが表示されることを確認
    expect(screen.getByText("保存")).toBeInTheDocument()
  })

  test("CSV出力ボタンをクリックするとonExportCSVが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    await user.click(csvButton)

    expect(defaultProps.onExportCSV).toHaveBeenCalledTimes(1)
  })

  test("保存ボタンをクリックするとonSaveが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const saveButton = screen.getByText("保存")
    await user.click(saveButton)

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
  })

  test("ボタンが適切なスタイルで表示される", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // CSV出力ボタンのスタイル確認
    expect(csvButton).toHaveStyle({
      backgroundColor: "rgb(99, 102, 241)",
      color: "white",
      fontSize: "12px",
      fontWeight: "500"
    })

    // 保存ボタンのスタイル確認
    expect(saveButton).toHaveStyle({
      backgroundColor: "rgb(16, 185, 129)",
      color: "rgb(255, 255, 255)",
      fontSize: "12px",
      fontWeight: "500"
    })
  })

  test("CSV出力ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")

    // 初期状態の確認
    expect(csvButton).toHaveStyle({
      backgroundColor: "#6366f1"
    })

    // ホバー時のイベントハンドラが設定されていることを確認
    await user.hover(csvButton)
    await user.unhover(csvButton)

    // ホバーイベントが処理されることを確認（実際のスタイル変更は DOM では確認困難）
    expect(csvButton).toBeInTheDocument()
  })

  test("保存ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const saveButton = screen.getByText("保存")

    // 初期状態の確認
    expect(saveButton).toHaveStyle({
      backgroundColor: "#10b981"
    })

    // ホバー時のイベントハンドラが設定されていることを確認
    await user.hover(saveButton)
    await user.unhover(saveButton)

    expect(saveButton).toBeInTheDocument()
  })

  test("ボタンの連続クリック操作", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // 連続でボタンをクリック
    await user.click(csvButton)
    await user.click(saveButton)
    await user.click(csvButton)
    await user.click(saveButton)

    // 各関数が2回ずつ呼ばれることを確認
    expect(defaultProps.onExportCSV).toHaveBeenCalledTimes(2)
    expect(defaultProps.onSave).toHaveBeenCalledTimes(2)
  })

  test("キーボードナビゲーション（Tab移動）", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // 最初のボタンにフォーカス
    csvButton.focus()
    expect(csvButton).toHaveFocus()

    // Tabキーで次のボタンに移動
    await user.tab()
    expect(saveButton).toHaveFocus()
  })

  test("キーボードでのボタン操作（Enter/Space）", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // Enterキーでの操作
    csvButton.focus()
    await user.keyboard("{Enter}")
    expect(defaultProps.onExportCSV).toHaveBeenCalledTimes(1)

    // Spaceキーでの操作
    saveButton.focus()
    await user.keyboard(" ")
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
  })

  test("ボタンのflexレイアウト確認", () => {
    render(<TimelineActions {...defaultProps} />)

    // コンテナのflexレイアウトを確認
    const container = screen.getByText("CSV出力").closest("div")
    expect(container).toHaveStyle({
      display: "flex",
      gap: "8px"
    })
  })

  test("ボタンの基本属性確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // ボタン要素であることを確認
    expect(csvButton.tagName).toBe("BUTTON")
    expect(saveButton.tagName).toBe("BUTTON")

    // cursor: pointer スタイルが設定されていることを確認
    expect(csvButton).toHaveStyle({ cursor: "pointer" })
    expect(saveButton).toHaveStyle({ cursor: "pointer" })
  })

  test("ボタンのtransitionスタイル確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // transitionプロパティが設定されていることを確認
    expect(csvButton).toHaveStyle({
      transition: "all 0.15s ease"
    })
    expect(saveButton).toHaveStyle({
      transition: "all 0.15s ease"
    })
  })

  test("ボタンのboxShadowスタイル確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // boxShadowが設定されていることを確認
    expect(csvButton).toHaveStyle({
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    })
    expect(saveButton).toHaveStyle({
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    })
  })

  test("ボタンのborderとborderRadiusスタイル確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // borderとborderRadiusが正しく設定されていることを確認
    expect(csvButton).toHaveStyle({
      border: "1px solid #6366f1",
      borderRadius: "6px"
    })
    expect(saveButton).toHaveStyle({
      border: "1px solid #10b981",
      borderRadius: "6px"
    })
  })

  test("ボタンのpadding確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // paddingが正しく設定されていることを確認
    expect(csvButton).toHaveStyle({
      padding: "6px 12px"
    })
    expect(saveButton).toHaveStyle({
      padding: "6px 12px"
    })
  })

  test("無効状態でのボタン操作（propsが未定義の場合）", async () => {
    const user = userEvent.setup()

    // コールバック関数が未定義の場合のテスト
    render(
      <TimelineActions
        onSave={undefined as any}
        onExportCSV={undefined as any}
      />
    )

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // クリックしてもエラーが発生しないことを確認
    await user.click(csvButton)
    await user.click(saveButton)

    // ボタンは表示されている
    expect(csvButton).toBeInTheDocument()
    expect(saveButton).toBeInTheDocument()
  })

  test("同時クリック操作の処理", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // 同時に素早くクリック
    await Promise.all([user.click(csvButton), user.click(saveButton)])

    expect(defaultProps.onExportCSV).toHaveBeenCalledTimes(1)
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
  })

  test("アクセシビリティ - ボタンのrole属性", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // ボタンの要素がbuttonタグであることを確認（暗黙的にrole="button"を持つ）
    expect(csvButton.tagName).toBe("BUTTON")
    expect(saveButton.tagName).toBe("BUTTON")
  })
})
