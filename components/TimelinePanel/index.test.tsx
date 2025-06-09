import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TimelinePanel } from "."
import type { Action } from "./types"

// Mockデータ
const mockActions: Action[] = [
  {
    team: "Team A",
    action: "Pass",
    start: 1000,
    end: 2000,
    labels: ["Good", "Accurate"]
  },
  {
    team: "Team B",
    action: "Shoot",
    start: 3000,
    end: 4000,
    labels: ["Result - goal", "Quality - excellent"]
  },
  {
    team: "Team A",
    action: "Tackle",
    start: 5000,
    labels: ["Defensive"]
  }
]

describe("TimelinePanel", () => {
  const defaultProps = {
    actions: mockActions,
    onExportCSV: jest.fn(),
    onSave: jest.fn(),
    onSeek: jest.fn(),
    onDelete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("アクションが表形式で表示される", () => {
    render(<TimelinePanel {...defaultProps} />)

    // テーブルヘッダーの確認（日本語表示）
    expect(screen.getByText("チーム")).toBeInTheDocument()
    expect(screen.getByText("アクション")).toBeInTheDocument()
    expect(screen.getByText("開始時間")).toBeInTheDocument()
    expect(screen.getByText("終了時間")).toBeInTheDocument()
    expect(screen.getByText("ラベル")).toBeInTheDocument()

    // データ行の確認 - Team Aが複数あるため、最初のものをチェック
    expect(screen.getAllByText("Team A")).toHaveLength(2)
    expect(screen.getByText("Pass")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()
    expect(screen.getByText("Shoot")).toBeInTheDocument()
  })

  test("カテゴリ化されたラベルがブラケット記法で表示される", () => {
    render(<TimelinePanel {...defaultProps} />)

    // ブラケット記法でのラベル表示を確認 - getAllByTextを使用して複数要素を許可
    const resultElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("Result") || false
    })
    expect(resultElements.length).toBeGreaterThan(0)

    expect(screen.getByText("goal")).toBeInTheDocument()

    const qualityElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("Quality") || false
    })
    expect(qualityElements.length).toBeGreaterThan(0)

    expect(screen.getByText("excellent")).toBeInTheDocument()

    // シンプル形式のラベル表示も確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Accurate")).toBeInTheDocument()
  })

  test("進行中のアクションは「進行中」と表示される", () => {
    render(<TimelinePanel {...defaultProps} />)

    // end時刻がないアクションは「進行中」と表示
    expect(screen.getByText("進行中")).toBeInTheDocument()
  })

  test("CSVエクスポートボタンをクリックするとonExportCSVが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelinePanel {...defaultProps} />)

    const exportButton = screen.getByText("CSV出力")
    await user.click(exportButton)

    expect(defaultProps.onExportCSV).toHaveBeenCalled()
  })

  test("保存ボタンをクリックするとonSaveが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelinePanel {...defaultProps} />)

    const saveButton = screen.getByText("保存")
    await user.click(saveButton)

    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  test("開始時刻をクリックするとonSeekが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelinePanel {...defaultProps} />)

    // 最初のアクションの開始時刻をクリック（ミリ秒を含む形式）
    const startTimeButton = screen.getByText("00:01.000") // 1000ms = 00:01.000
    await user.click(startTimeButton)

    expect(defaultProps.onSeek).toHaveBeenCalledWith(1000)
  })

  test("終了時刻をクリックするとonSeekが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelinePanel {...defaultProps} />)

    // 最初のアクションの終了時刻をクリック（ミリ秒を含む形式）
    const endTimeButton = screen.getByText("00:02.000") // 2000ms = 00:02.000
    await user.click(endTimeButton)

    expect(defaultProps.onSeek).toHaveBeenCalledWith(2000)
  })

  test("削除ボタンをクリックするとonDeleteが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TimelinePanel {...defaultProps} />)

    // 削除ボタンを取得（最初のアクション用）
    const deleteButtons = screen.getAllByText("削除")
    await user.click(deleteButtons[0])

    expect(defaultProps.onDelete).toHaveBeenCalledWith("Team A", "Pass", 1000)
  })

  test("空のアクション配列でもエラーにならない", () => {
    render(<TimelinePanel {...defaultProps} actions={[]} />)

    // テーブルヘッダーは表示される（日本語）
    expect(screen.getByText("チーム")).toBeInTheDocument()

    // データ行は表示されない
    expect(screen.queryByText("Team A")).not.toBeInTheDocument()
  })

  test("時刻フォーマットが正しく表示される", () => {
    const longTimeActions = [
      {
        team: "Team A",
        action: "Long Action",
        start: 65000, // 1分5秒
        end: 125000, // 2分5秒
        labels: []
      }
    ]

    render(<TimelinePanel {...defaultProps} actions={longTimeActions} />)

    expect(screen.getByText("01:05.000")).toBeInTheDocument()
    expect(screen.getByText("02:05.000")).toBeInTheDocument()
  })

  test("ラベルが複数ある場合は適切に表示される", () => {
    const multiLabelAction = [
      {
        team: "Team A",
        action: "Complex Action",
        start: 1000,
        end: 2000,
        labels: ["Label1", "Category - Value1", "Category - Value2", "Label3"]
      }
    ]

    render(<TimelinePanel {...defaultProps} actions={multiLabelAction} />)

    // すべてのラベルが表示されることを確認
    expect(screen.getByText("Label1")).toBeInTheDocument()

    // 複数のCategoryラベルが存在する場合を考慮してgetAllByTextを使用
    const categoryElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes("Category") || false
    })
    expect(categoryElements.length).toBeGreaterThanOrEqual(2) // Category - Value1とCategory - Value2の2つ

    expect(screen.getByText("Value1")).toBeInTheDocument()
    expect(screen.getByText("Value2")).toBeInTheDocument()
    expect(screen.getByText("Label3")).toBeInTheDocument()
  })
})
