import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import MockFileReader, { createMockFileReader } from '../helpers/MockFileReader'

// actionsManagerの関数をモック
jest.mock("../../lib/actionsManager", () => ({
  addTeam: jest.fn(),
  addAction: jest.fn(),
  startAction: jest.fn(),
  stopAction: jest.fn(),
  deleteAction: jest.fn(),
  addLabel: jest.fn(),
  getActions: jest.fn(() => []),
  getTeams: jest.fn(() => []),
  saveTimelineForVideo: jest.fn(),
  loadTimelineForVideo: jest.fn(),
  exportActionsToCSV: jest.fn()
}))

// buttonSetManagerの関数をモック
jest.mock("../../lib/buttonSetManager", () => ({
  createButtonSet: jest.fn(),
  updateButtonSet: jest.fn(),
  deleteButtonSet: jest.fn(),
  getButtonSets: jest.fn(() => []),
  convertLegacyToModernFormat: jest.fn(),
  convertModernToLegacyFormat: jest.fn(),
  validateButtonSetData: jest.fn(() => ({ isValid: true, errors: [] })),
  mergeButtonSets: jest.fn()
}))

// sheetsの関数をモック
jest.mock("../../lib/sheets", () => ({
  loadGoogleAPI: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  isSignedIn: jest.fn(() => false),
  appendToSheet: jest.fn(),
  getAuthUrl: jest.fn(() => "https://mock-auth-url.com"),
  setCredentials: jest.fn()
}))

// Chrome API のモック
Object.defineProperty(global, "chrome", {
  value: {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn()
      }
    },
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    }
  },
  writable: true
})

// File API のモック
Object.defineProperty(global, "File", {
  value: jest.fn().mockImplementation((content, name, options) => ({
    name,
    size: content.length,
    type: options?.type || "text/plain",
    lastModified: Date.now(),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(content),
    stream: () => new ReadableStream(),
    slice: () => new Blob()
  })),
  writable: true
})

import MockFileReader from '../helpers/MockFileReader'

// Mock FileReader with our custom class that properly handles events
const FileReaderMock = jest.fn().mockImplementation(() => new MockFileReader());
// グローバルのFileReaderをモッククラスで置き換え
Object.defineProperty(global, "FileReader", {
  value: FileReaderMock,
  writable: true
})

// URL.createObjectURL のモック
Object.defineProperty(global.URL, "createObjectURL", {
  value: jest.fn(() => "blob:mock-url"),
  writable: true
})

Object.defineProperty(global.URL, "revokeObjectURL", {
  value: jest.fn(),
  writable: true
})

// テスト用のサンプルデータ
const sampleButtonSetData = {
  setName: "サッカー統合セット",
  buttons: [
    {
      action: "パス",
      labels: {
        方向: ["前", "後", "左", "右"],
        精度: ["正確", "不正確"],
        一般: ["良い", "普通"]
      }
    },
    {
      action: "シュート",
      labels: {
        結果: ["ゴール", "セーブ", "外れ"],
        位置: ["ペナルティエリア内", "ペナルティエリア外"]
      }
    }
  ]
}

const sampleTimelineData = [
  {
    team: "チームA",
    action: "パス",
    start: 1000,
    end: 2000,
    labels: ["方向 - 前", "精度 - 正確", "良い"]
  },
  {
    team: "チームB",
    action: "シュート",
    start: 3000,
    end: 4000,
    labels: ["結果 - ゴール", "位置 - ペナルティエリア内"]
  },
  {
    team: "チームA",
    action: "パス",
    start: 5000,
    labels: ["方向 - 後"]
  }
]

// エンドツーエンドテスト用のメインコンポーネント
const E2ETestComponent: React.FC = () => {
  const [buttonSets, setButtonSets] = React.useState([sampleButtonSetData])
  const [teams, setTeams] = React.useState(["チームA", "チームB"])
  const [timelineActions, setTimelineActions] =
    React.useState(sampleTimelineData)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [exportStatus, setExportStatus] = React.useState("")

  // JSON Import/Export
  const handleJSONImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const data = JSON.parse(result)

          if (data.buttonSets) {
            setButtonSets(data.buttonSets)
          }
          if (data.teams) {
            setTeams(data.teams)
          }
          if (data.timelineActions) {
            setTimelineActions(data.timelineActions)
          }

          setExportStatus("JSON データをインポートしました")
        } catch (error) {
          setExportStatus("JSON インポートエラー: 無効なファイル形式")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleJSONExport = () => {
    const exportData = {
      buttonSets,
      teams,
      timelineActions,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "youcoder-export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportStatus("JSON データをエクスポートしました")
  }

  // CSV Export
  const handleCSVExport = () => {
    const csvHeader = "Team,Action,Start,End,Duration,Labels\n"
    const csvRows = timelineActions
      .map((action) => {
        const duration = action.end ? action.end - action.start : "N/A"
        const labels = action.labels.join(";")
        return `${action.team},${action.action},${action.start},${action.end || "N/A"},${duration},"${labels}"`
      })
      .join("\n")

    const csvContent = csvHeader + csvRows
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "timeline-export.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExportStatus("CSV データをエクスポートしました")
  }

  // Google Sheets Integration
  const handleGoogleSheetsAuth = async () => {
    try {
      setIsAuthenticated(true)
      setExportStatus("Google Sheets に認証しました")
    } catch (error) {
      setExportStatus("Google Sheets 認証エラー")
    }
  }

  const handleExportToSheets = async () => {
    if (!isAuthenticated) {
      setExportStatus("先に Google Sheets に認証してください")
      return
    }

    try {
      setExportStatus("Google Sheets にエクスポート中...")
      // Mock export to sheets
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setExportStatus("Google Sheets にエクスポートしました")
    } catch (error) {
      setExportStatus("Google Sheets エクスポートエラー")
    }
  }

  return (
    <div data-testid="e2e-test-component">
      <div data-testid="import-export-section">
        <h3>データ管理</h3>

        {/* JSON Import */}
        <div>
          <label htmlFor="json-import">JSON インポート:</label>
          <input
            id="json-import"
            type="file"
            accept=".json"
            onChange={handleJSONImport}
            data-testid="json-import-input"
          />
        </div>

        {/* JSON Export */}
        <button onClick={handleJSONExport} data-testid="json-export-button">
          JSON エクスポート
        </button>

        {/* CSV Export */}
        <button onClick={handleCSVExport} data-testid="csv-export-button">
          CSV エクスポート
        </button>

        {/* Status */}
        <div data-testid="export-status">{exportStatus}</div>
      </div>

      <div data-testid="google-sheets-section">
        <h3>Google Sheets 連携</h3>
        <button onClick={handleGoogleSheetsAuth} data-testid="auth-button">
          Google Sheets 認証
        </button>
        <button
          onClick={handleExportToSheets}
          data-testid="export-to-sheets-button"
          disabled={!isAuthenticated}>
          Sheets にエクスポート
        </button>
        <div data-testid="auth-status">
          認証状態: {isAuthenticated ? "認証済み" : "未認証"}
        </div>
      </div>

      <div data-testid="data-summary">
        <h3>データサマリー</h3>
        <div>ボタンセット数: {buttonSets.length}</div>
        <div>チーム数: {teams.length}</div>
        <div>タイムラインアクション数: {timelineActions.length}</div>
      </div>

      <div data-testid="timeline-display">
        <h3>タイムライン</h3>
        <table>
          <thead>
            <tr>
              <th>チーム</th>
              <th>アクション</th>
              <th>開始時刻</th>
              <th>終了時刻</th>
              <th>ラベル</th>
            </tr>
          </thead>
          <tbody>
            {timelineActions.map((action, index) => (
              <tr key={index} data-testid={`timeline-row-${index}`}>
                <td>{action.team}</td>
                <td>{action.action}</td>
                <td>{action.start}ms</td>
                <td>{action.end ? `${action.end}ms` : "進行中"}</td>
                <td>{action.labels.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

describe("エンドツーエンドテスト - 高度な機能", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Chrome storage mock setup
    ;(global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
      buttonSets: [sampleButtonSetData],
      teams: ["チームA", "チームB"],
      timelines: {
        "test-video-id": sampleTimelineData
      }
    })
    ;(global.chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined)
  })

  test("JSON エクスポート機能の完全フロー", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    // 初期データの確認
    expect(screen.getByText("ボタンセット数: 1")).toBeInTheDocument()
    expect(screen.getByText("チーム数: 2")).toBeInTheDocument()
    expect(screen.getByText("タイムラインアクション数: 3")).toBeInTheDocument()

    // JSON エクスポート実行
    const exportButton = screen.getByTestId("json-export-button")
    await user.click(exportButton)

    await waitFor(() => {
      expect(
        screen.getByText("JSON データをエクスポートしました")
      ).toBeInTheDocument()
    })

    // URL.createObjectURL が呼ばれることを確認
    expect(global.URL.createObjectURL).toHaveBeenCalled()
  })

  test("JSON インポート機能の完全フロー", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    const importInput = screen.getByTestId("json-import-input")

    // モックファイルの作成
    const mockFile = new File(
      [
        JSON.stringify({
          buttonSets: [
            sampleButtonSetData,
            { setName: "追加セット", buttons: [] }
          ],
          teams: ["チームA", "チームB", "チームC"],
          timelineActions: [
            ...sampleTimelineData,
            {
              team: "チームC",
              action: "タックル",
              start: 6000,
              end: 7000,
              labels: ["強い"]
            }
          ]
        })
      ],
      "test-import.json",
      { type: "application/json" }
    )

    // FileReaderのインスタンスを取得
    const mockFileReader = new MockFileReader()

    // ファイル選択をシミュレート
    await user.upload(importInput, mockFile)

    // FileReader.readAsText が呼ばれることを確認
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)

    // onload イベントをシミュレート
    const importedData = {
      buttonSets: [sampleButtonSetData, { setName: "追加セット", buttons: [] }],
      teams: ["チームA", "チームB", "チームC"],
      timelineActions: [
        ...sampleTimelineData,
        {
          team: "チームC",
          action: "タックル",
          start: 6000,
          end: 7000,
          labels: ["強い"]
        }
      ]
    }

    mockFileReader.result = JSON.stringify(importedData)
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any)
    }

    await waitFor(() => {
      expect(
        screen.getByText("JSON データをインポートしました")
      ).toBeInTheDocument()
    })
  })

  test("CSV エクスポート機能", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    const csvExportButton = screen.getByTestId("csv-export-button")
    await user.click(csvExportButton)

    await waitFor(() => {
      expect(
        screen.getByText("CSV データをエクスポートしました")
      ).toBeInTheDocument()
    })

    // Blob と URL.createObjectURL が正しく呼ばれることを確認
    expect(global.URL.createObjectURL).toHaveBeenCalled()
  })

  test("Google Sheets 認証と連携の完全フロー", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    // 初期状態では未認証
    expect(screen.getByText("認証状態: 未認証")).toBeInTheDocument()

    const exportToSheetsButton = screen.getByTestId("export-to-sheets-button")
    expect(exportToSheetsButton).toBeDisabled()

    // 認証実行
    const authButton = screen.getByTestId("auth-button")
    await user.click(authButton)

    await waitFor(() => {
      expect(screen.getByText("認証状態: 認証済み")).toBeInTheDocument()
      expect(
        screen.getByText("Google Sheets に認証しました")
      ).toBeInTheDocument()
    })

    // 認証後はエクスポートボタンが有効になる
    expect(exportToSheetsButton).not.toBeDisabled()

    // Sheets エクスポート実行
    await user.click(exportToSheetsButton)

    // ローディング状態の確認
    expect(
      screen.getByText("Google Sheets にエクスポート中...")
    ).toBeInTheDocument()

    // 完了状態の確認
    await waitFor(
      () => {
        expect(
          screen.getByText("Google Sheets にエクスポートしました")
        ).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  test("無効な JSON インポート時のエラーハンドリング", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    const importInput = screen.getByTestId("json-import-input")

    // 無効なJSONファイルを作成
    const invalidFile = new File(["{ invalid json }"], "invalid.json", {
      type: "application/json"
    })

    const mockFileReader = {
      readAsText: jest.fn(),
      result: "{ invalid json }",
      onload: null,
      onerror: null
    }

    ;(global.FileReader as jest.Mock).mockImplementation(() => mockFileReader)

    await user.upload(importInput, invalidFile)

    // onload イベントをシミュレート（無効なJSON）
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any)
    }

    await waitFor(() => {
      expect(
        screen.getByText("JSON インポートエラー: 無効なファイル形式")
      ).toBeInTheDocument()
    })
  })

  test("認証前の Sheets エクスポート試行", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    // 認証前にエクスポート試行
    const exportToSheetsButton = screen.getByTestId("export-to-sheets-button")

    // ボタンが無効化されていることを確認
    expect(exportToSheetsButton).toBeDisabled()
  })

  test("カテゴリ化ラベルを含むデータの CSV エクスポート", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    // タイムラインにカテゴリ化ラベルが含まれることを確認
    expect(screen.getByText("方向 - 前, 精度 - 正確, 良い")).toBeInTheDocument()
    expect(
      screen.getByText("結果 - ゴール, 位置 - ペナルティエリア内")
    ).toBeInTheDocument()

    // CSV エクスポート実行
    const csvButton = screen.getByTestId("csv-export-button")
    await user.click(csvButton)

    await waitFor(() => {
      expect(
        screen.getByText("CSV データをエクスポートしました")
      ).toBeInTheDocument()
    })
  })

  test("大量データの処理性能", async () => {
    const LargeDataComponent: React.FC = () => {
      // 大量のタイムラインデータを生成
      const largeTimelineData = Array.from({ length: 1000 }, (_, i) => ({
        team: `チーム${(i % 10) + 1}`,
        action: `アクション${(i % 5) + 1}`,
        start: i * 1000,
        end: (i + 1) * 1000,
        labels: [
          `ラベル${(i % 3) + 1}`,
          `カテゴリ${(i % 2) + 1} - 値${(i % 4) + 1}`
        ]
      }))

      const [timelineActions] = React.useState(largeTimelineData)
      const [exportStatus, setExportStatus] = React.useState("")

      const handleLargeCSVExport = () => {
        const startTime = performance.now()

        const csvHeader = "Team,Action,Start,End,Duration,Labels\n"
        const csvRows = timelineActions
          .map((action) => {
            const duration = action.end - action.start
            const labels = action.labels.join(";")
            return `${action.team},${action.action},${action.start},${action.end},${duration},"${labels}"`
          })
          .join("\n")

        const csvContent = csvHeader + csvRows
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)

        const endTime = performance.now()
        const processingTime = Math.round(endTime - startTime)

        setExportStatus(
          `大量データ (${timelineActions.length}件) を ${processingTime}ms で処理しました`
        )

        URL.revokeObjectURL(url)
      }

      return (
        <div>
          <div>アクション数: {timelineActions.length}</div>
          <button onClick={handleLargeCSVExport} data-testid="large-csv-export">
            大量データ CSV エクスポート
          </button>
          <div data-testid="performance-status">{exportStatus}</div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<LargeDataComponent />)

    expect(screen.getByText("アクション数: 1000")).toBeInTheDocument()

    const exportButton = screen.getByTestId("large-csv-export")
    await user.click(exportButton)

    await waitFor(() => {
      const statusElement = screen.getByTestId("performance-status")
      expect(statusElement.textContent).toContain("大量データ (1000件) を")
      expect(statusElement.textContent).toContain("ms で処理しました")
    })
  })

  test("後方互換性 - 旧形式データのインポート", async () => {
    const user = userEvent.setup()
    render(<E2ETestComponent />)

    // 旧形式のボタンセットデータ
    const legacyData = {
      buttonSets: [
        {
          setName: "旧形式セット",
          buttons: [
            {
              action: "パス",
              labels: ["前", "後", "正確", "不正確"] // フラット形式
            }
          ]
        }
      ],
      teams: ["チームA"],
      timelineActions: [
        {
          team: "チームA",
          action: "パス",
          start: 1000,
          end: 2000,
          labels: ["前", "正確"] // フラット形式
        }
      ]
    }

    const importInput = screen.getByTestId("json-import-input")
    const mockFile = new File([JSON.stringify(legacyData)], "legacy.json", {
      type: "application/json"
    })

    const mockFileReader = {
      readAsText: jest.fn(),
      result: JSON.stringify(legacyData),
      onload: null,
      onerror: null
    }

    ;(global.FileReader as jest.Mock).mockImplementation(() => mockFileReader)

    await user.upload(importInput, mockFile)

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any)
    }

    await waitFor(() => {
      expect(
        screen.getByText("JSON データをインポートしました")
      ).toBeInTheDocument()
    })
  })
})
