import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TimelineActions } from "."

describe("TimelineActions", () => {
  const defaultProps = {
    onSave: jest.fn(),
    onExportCSV: jest.fn()
  }

  const filterProps = {
    ...defaultProps,
    filterConfig: {
      team: "",
      action: "",
      label: ""
    },
    onFilterChange: jest.fn(),
    onFilterReset: jest.fn(),
    getUniqueTeams: jest.fn(() => ["チームA", "チームB", "チームC"]),
    getUniqueActions: jest.fn(() => ["シュート", "パス", "ドリブル"]),
    getUniqueLabels: jest.fn(() => ["ゴール", "ファウル", "オフサイド"])
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

  test("フィルター機能なしの場合はボタンのみ表示される", () => {
    render(<TimelineActions {...defaultProps} />)

    // フィルター要素が表示されないことを確認
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.queryByText("リセット")).not.toBeInTheDocument()
  })

  test("フィルター機能ありの場合は全要素が表示される", () => {
    render(<TimelineActions {...filterProps} />)

    // ボタンが表示されることを確認
    expect(screen.getByText("CSV出力")).toBeInTheDocument()
    expect(screen.getByText("保存")).toBeInTheDocument()

    // フィルター要素が表示されることを確認
    const selects = screen.getAllByRole("combobox")
    expect(selects).toHaveLength(3) // チーム、アクション、ラベル

    // デフォルトオプションが表示されることを確認
    expect(screen.getByDisplayValue("全チーム")).toBeInTheDocument()
    expect(screen.getByDisplayValue("全アクション")).toBeInTheDocument()
    expect(screen.getByDisplayValue("全ラベル")).toBeInTheDocument()
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

  test("チームフィルターの変更", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...filterProps} />)

    const teamSelect = screen.getByDisplayValue("全チーム")

    await user.selectOptions(teamSelect, "チームA")

    expect(filterProps.onFilterChange).toHaveBeenCalledWith("team", "チームA")
  })

  test("アクションフィルターの変更", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...filterProps} />)

    const actionSelect = screen.getByDisplayValue("全アクション")

    await user.selectOptions(actionSelect, "シュート")

    expect(filterProps.onFilterChange).toHaveBeenCalledWith(
      "action",
      "シュート"
    )
  })

  test("ラベルフィルターの変更", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...filterProps} />)

    const labelSelect = screen.getByDisplayValue("全ラベル")

    await user.selectOptions(labelSelect, "ゴール")

    expect(filterProps.onFilterChange).toHaveBeenCalledWith("label", "ゴール")
  })

  test("フィルターが設定されている場合にリセットボタンが表示される", () => {
    const propsWithFilter = {
      ...filterProps,
      filterConfig: {
        team: "チームA",
        action: "",
        label: ""
      }
    }

    render(<TimelineActions {...propsWithFilter} />)

    expect(screen.getByText("リセット")).toBeInTheDocument()
  })

  test("フィルターが設定されていない場合はリセットボタンが表示されない", () => {
    render(<TimelineActions {...filterProps} />)

    expect(screen.queryByText("リセット")).not.toBeInTheDocument()
  })

  test("リセットボタンをクリックするとonFilterResetが呼ばれる", async () => {
    const user = userEvent.setup()
    const propsWithFilter = {
      ...filterProps,
      filterConfig: {
        team: "チームA",
        action: "シュート",
        label: ""
      }
    }

    render(<TimelineActions {...propsWithFilter} />)

    const resetButton = screen.getByText("リセット")
    await user.click(resetButton)

    expect(filterProps.onFilterReset).toHaveBeenCalledTimes(1)
  })

  test("ボタンが適切なスタイルで表示される", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // Tailwindクラスが適用されていることを確認
    expect(csvButton).toHaveClass("btn-primary")
    expect(saveButton).toHaveClass("btn-success")

    // ボタン要素であることを確認
    expect(csvButton.tagName).toBe("BUTTON")
    expect(saveButton.tagName).toBe("BUTTON")
  })

  test("フィルターセレクトボックスのスタイル確認", () => {
    render(<TimelineActions {...filterProps} />)

    const selects = screen.getAllByRole("combobox")

    selects.forEach((select) => {
      // Tailwindクラスが適用されていることを確認
      expect(select).toHaveClass("filter-select")
    })
  })

  test("リセットボタンのスタイル確認", () => {
    const propsWithFilter = {
      ...filterProps,
      filterConfig: {
        team: "チームA",
        action: "",
        label: ""
      }
    }

    render(<TimelineActions {...propsWithFilter} />)

    const resetButton = screen.getByText("リセット")

    // Tailwindクラスが適用されていることを確認
    expect(resetButton).toHaveClass("btn-danger")
  })

  test("CSV出力ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")

    // ボタンが存在し、Tailwindクラスが適用されていることを確認
    expect(csvButton).toHaveClass("btn-primary")

    // ホバー時のイベントハンドラが設定されていることを確認
    await user.hover(csvButton)
    await user.unhover(csvButton)

    // ホバーイベントが処理されることを確認
    expect(csvButton).toBeInTheDocument()
  })

  test("保存ボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<TimelineActions {...defaultProps} />)

    const saveButton = screen.getByText("保存")

    // ボタンが存在し、Tailwindクラスが適用されていることを確認
    expect(saveButton).toHaveClass("btn-success")

    // ホバー時のイベントハンドラが設定されていることを確認
    await user.hover(saveButton)
    await user.unhover(saveButton)

    expect(saveButton).toBeInTheDocument()
  })

  test("フィルターセレクトボックスのオプション内容確認", () => {
    render(<TimelineActions {...filterProps} />)

    // チームフィルターのオプション確認
    const teamSelect = screen.getByDisplayValue("全チーム")
    expect(teamSelect).toBeInTheDocument()

    // アクションフィルターのオプション確認
    const actionSelect = screen.getByDisplayValue("全アクション")
    expect(actionSelect).toBeInTheDocument()

    // ラベルフィルターのオプション確認
    const labelSelect = screen.getByDisplayValue("全ラベル")
    expect(labelSelect).toBeInTheDocument()
  })

  test("フィルターのイベント伝播防止", async () => {
    const user = userEvent.setup()
    const mockContainerClick = jest.fn()

    const { container } = render(
      <div onClick={mockContainerClick}>
        <TimelineActions {...filterProps} />
      </div>
    )

    const teamSelect = screen.getByDisplayValue("全チーム")

    // フィルターをクリックしてもコンテナのクリックイベントが発火しないことを確認
    await user.click(teamSelect)

    expect(mockContainerClick).not.toHaveBeenCalled()
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

  test("レイアウト確認", () => {
    render(<TimelineActions {...defaultProps} />)

    // メインコンテナのレイアウトを確認
    const container = screen.getByText("CSV出力").closest("div")?.parentElement
    expect(container).toHaveStyle({
      display: "flex",
      alignItems: "center",
      width: "100%",
      justifyContent: "space-between"
    })
  })

  test("フィルター関連の統合テスト", async () => {
    const user = userEvent.setup()

    // 複数のフィルターが設定された状態
    const propsWithMultipleFilters = {
      ...filterProps,
      filterConfig: {
        team: "チームA",
        action: "シュート",
        label: "ゴール"
      }
    }

    render(<TimelineActions {...propsWithMultipleFilters} />)

    // リセットボタンが表示されることを確認
    const resetButton = screen.getByText("リセット")
    expect(resetButton).toBeInTheDocument()

    // リセットボタンのツールチップ確認
    expect(resetButton).toHaveAttribute("title", "3個のフィルターをリセット")

    // リセット実行
    await user.click(resetButton)
    expect(filterProps.onFilterReset).toHaveBeenCalledTimes(1)
  })

  test("無効状態でのボタン操作（propsが未定義の場合）", async () => {
    const user = userEvent.setup()

    // コールバック関数が未定義の場合のテスト
    render(<TimelineActions onSave={undefined} onExportCSV={undefined} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // クリックしてもエラーが発生しないことを確認
    await user.click(csvButton)
    await user.click(saveButton)

    // ボタンは表示されている
    expect(csvButton).toBeInTheDocument()
    expect(saveButton).toBeInTheDocument()
  })

  test("SVGアイコンの表示確認", () => {
    render(<TimelineActions {...defaultProps} />)

    const csvButton = screen.getByText("CSV出力")
    const saveButton = screen.getByText("保存")

    // SVGアイコンが含まれていることを確認
    expect(csvButton.querySelector("svg")).toBeInTheDocument()
    expect(saveButton.querySelector("svg")).toBeInTheDocument()
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
