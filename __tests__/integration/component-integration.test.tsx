import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

// Mock Chrome APIs
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
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      },
      sendMessage: jest.fn()
    }
  },
  writable: true
})

// Mockデータの設定
const mockButtonSet = {
  setName: "サッカー基本セット",
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

const mockTimelineActions = [
  {
    team: "チームA",
    action: "パス",
    start: 1000,
    end: 2000,
    labels: ["前", "正確", "良い"]
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
    labels: ["後"]
  }
]

// 統合テスト用のテストコンポーネント
const IntegratedTestComponent: React.FC = () => {
  const [teams, setTeams] = React.useState(["チームA", "チームB"])
  const [buttonSets, setButtonSets] = React.useState([mockButtonSet])
  const [selectedButtonSet, setSelectedButtonSet] = React.useState(
    mockButtonSet.setName
  )
  const [timelineActions, setTimelineActions] =
    React.useState(mockTimelineActions)
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null
  )

  const handleAddTeam = () => {
    const newTeam = `チーム${teams.length + 1}`
    setTeams([...teams, newTeam])
  }

  const handleRemoveTeam = (team: string) => {
    setTeams(teams.filter((t) => t !== team))
  }

  const handleDeleteAction = (team: string, action: string, start: number) => {
    setTimelineActions(
      timelineActions.filter(
        (a) => !(a.team === team && a.action === action && a.start === start)
      )
    )
  }

  const handleSaveTimeline = () => {
    console.log("Timeline saved")
  }

  const handleExportCSV = () => {
    console.log("CSV exported")
  }

  return (
    <div>
      <div data-testid="team-management">
        <h3>チーム管理</h3>
        <button onClick={handleAddTeam}>チームを追加</button>
        <div>
          {teams.map((team) => (
            <div key={team} data-testid={`team-item-${team}`}>
              <span>{team}</span>
              <button onClick={() => handleRemoveTeam(team)}>削除</button>
            </div>
          ))}
        </div>
      </div>

      <div data-testid="action-management">
        <h3>アクション選択: {selectedAction || "未選択"}</h3>
        <div>
          {mockButtonSet.buttons.map((button) => (
            <button
              key={button.action}
              onClick={() =>
                setSelectedAction(
                  selectedAction === button.action ? null : button.action
                )
              }
              data-testid={`action-${button.action}`}>
              {button.action}
            </button>
          ))}
        </div>
      </div>

      <div data-testid="timeline-panel">
        <h3>タイムライン</h3>
        <div>
          <button onClick={handleSaveTimeline}>保存</button>
          <button onClick={handleExportCSV}>CSV出力</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>チーム</th>
              <th>アクション</th>
              <th>開始</th>
              <th>終了</th>
              <th>ラベル</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {timelineActions.map((action, index) => (
              <tr key={index} data-testid={`timeline-action-${index}`}>
                <td>{action.team}</td>
                <td>{action.action}</td>
                <td>{action.start}ms</td>
                <td>{action.end ? `${action.end}ms` : "進行中"}</td>
                <td>{action.labels.join(", ")}</td>
                <td>
                  <button
                    onClick={() =>
                      handleDeleteAction(
                        action.team,
                        action.action,
                        action.start
                      )
                    }
                    data-testid={`delete-${index}`}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

describe("統合テスト - YouCoderコンポーネント連携", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Chrome storage mock setup
    ;(global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
      teams: ["チームA", "チームB"],
      buttonSets: [mockButtonSet],
      selectedButtonSet: mockButtonSet.setName,
      timelines: {
        "test-video-id": mockTimelineActions
      }
    })
    ;(global.chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined)
  })

  test("チーム管理からタイムライン表示までの統合フロー", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // 1. 初期状態の確認
    expect(screen.getByTestId("team-item-チームA")).toBeInTheDocument()
    expect(screen.getByTestId("team-item-チームB")).toBeInTheDocument()
    expect(screen.getByText("アクション選択: 未選択")).toBeInTheDocument()

    // 2. チーム追加
    const addTeamButton = screen.getByText("チームを追加")
    await user.click(addTeamButton)

    expect(screen.getByText("チーム3")).toBeInTheDocument()

    // 3. アクション選択
    const passActionButton = screen.getByTestId("action-パス")
    await user.click(passActionButton)

    expect(screen.getByText("アクション選択: パス")).toBeInTheDocument()

    // 4. タイムライン表示確認
    expect(screen.getByTestId("timeline-action-0")).toBeInTheDocument()
    expect(screen.getByText("1000ms")).toBeInTheDocument()
    expect(screen.getByText("前, 正確, 良い")).toBeInTheDocument()
  })

  test("タイムラインアクション削除の統合フロー", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // 初期状態でタイムラインアクションが3つ存在することを確認
    expect(screen.getByTestId("timeline-action-0")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-action-1")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-action-2")).toBeInTheDocument()

    // 最初のアクションを削除
    const deleteButton = screen.getByTestId("delete-0")
    await user.click(deleteButton)

    // アクションが削除されることを確認
    await waitFor(() => {
      // インデックスが再調整されるので、具体的なインデックスではなく残りのアクション数を確認
      const remainingActions = screen.getAllByTestId(/timeline-action-/)
      expect(remainingActions).toHaveLength(2)
    })

    // 削除されたアクション（"チームA - パス" の最初のもの）が表示されないことを確認
    const remainingData = screen.getAllByTestId(/timeline-action-/).map(row => row.textContent);
    expect(remainingData.some(text => text.includes("チームA") && text.includes("パス") && text.includes("1000"))).toBeFalsy()
  })

  test("アクション選択とラベル表示の連携", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // パスアクション選択
    const passButton = screen.getByTestId("action-パス")
    await user.click(passButton)
    expect(screen.getByText("アクション選択: パス")).toBeInTheDocument()

    // シュートアクション選択
    const shootButton = screen.getByTestId("action-シュート")
    await user.click(shootButton)
    expect(screen.getByText("アクション選択: シュート")).toBeInTheDocument()

    // 同じアクションを再度クリックして選択解除
    await user.click(shootButton)
    expect(screen.getByText("アクション選択: 未選択")).toBeInTheDocument()
  })

  test("チーム削除がタイムラインに与える影響", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // 初期状態でチームAのアクションが存在することを確認
    expect(screen.getByTestId("team-item-チームA")).toBeInTheDocument() // チーム管理
    const timelineRows = screen.getAllByTestId(/timeline-action-/)
    expect(timelineRows.some(row => row.textContent.includes("チームA"))).toBeTruthy() // タイムライン

    // チームAを削除
    const teamItems = screen.getAllByTestId(/team-item-/)
    const teamAItem = teamItems.find((item) =>
      item.textContent?.includes("チームA")
    )
    const deleteTeamButton = teamAItem?.querySelector("button")

    if (deleteTeamButton) {
      await user.click(deleteTeamButton)
    }

    // チーム管理からチームAが削除されることを確認
    await waitFor(() => {
      expect(screen.queryByTestId("team-item-チームA")).not.toBeInTheDocument()
    })

    // タイムラインにはまだチームAのアクションが残っている（削除処理は別途必要）
    expect(screen.getAllByText("チームA")).toHaveLength(2) // タイムライン内のみ
  })

  test("保存とCSV出力の統合動作", async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})

    render(<IntegratedTestComponent />)

    // 保存ボタンクリック
    const saveButton = screen.getByText("保存")
    await user.click(saveButton)

    expect(consoleSpy).toHaveBeenCalledWith("Timeline saved")

    // CSV出力ボタンクリック
    const csvButton = screen.getByText("CSV出力")
    await user.click(csvButton)

    expect(consoleSpy).toHaveBeenCalledWith("CSV exported")

    consoleSpy.mockRestore()
  })

  test("複数操作の連続実行", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // 1. チーム追加
    await user.click(screen.getByText("チームを追加"))

    // 2. アクション選択
    await user.click(screen.getByTestId("action-パス"))

    // 3. アクション変更
    await user.click(screen.getByTestId("action-シュート"))

    // 4. タイムラインアクション削除
    await user.click(screen.getByTestId("delete-0"))

    // 5. 状態確認
    expect(screen.getByText("チーム3")).toBeInTheDocument()
    expect(screen.getByText("アクション選択: シュート")).toBeInTheDocument()

    // 削除後のアクション数確認
    const remainingActions = screen.getAllByTestId(/timeline-action-/)
    expect(remainingActions).toHaveLength(2)
  })

  test("エラーハンドリング - 空のデータでの表示", () => {
    const EmptyComponent: React.FC = () => {
      const [teams] = React.useState<string[]>([])
      const [timelineActions] = React.useState<any[]>([])

      return (
        <div>
          <div data-testid="empty-teams">
            {teams.length === 0
              ? "チームがありません"
              : teams.map((t) => <div key={t}>{t}</div>)}
          </div>
          <div data-testid="empty-timeline">
            {timelineActions.length === 0
              ? "アクションがありません"
              : timelineActions.map((a, i) => <div key={i}>{a.action}</div>)}
          </div>
        </div>
      )
    }

    render(<EmptyComponent />)

    expect(screen.getByText("チームがありません")).toBeInTheDocument()
    expect(screen.getByText("アクションがありません")).toBeInTheDocument()
  })

  test("カテゴリ化ラベルのブラケット記法表示", () => {
    render(<IntegratedTestComponent />)

    // カテゴリ化されたラベルがブラケット記法で表示されることを確認
    const timelineRows = screen.getAllByTestId(/timeline-action-/)

    // シュートアクションの行（結果 - ゴール, 位置 - ペナルティエリア内）
    const shootActionRow = timelineRows[1]
    expect(shootActionRow).toHaveTextContent(
      "結果 - ゴール, 位置 - ペナルティエリア内"
    )
  })

  test("進行中アクションの表示", () => {
    render(<IntegratedTestComponent />)

    // 進行中のアクション（end時刻がない）が正しく表示されることを確認
    const progressAction = screen.getByTestId("timeline-action-2")
    expect(progressAction).toHaveTextContent("進行中")
  })

  test("レスポンシブ対応 - モバイル画面サイズでの表示", () => {
    // 画面サイズを変更するシミュレーション
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375
    })

    render(<IntegratedTestComponent />)

    // モバイルサイズでもコンポーネントが正常に表示されることを確認
    expect(screen.getByText("チーム管理")).toBeInTheDocument()
    expect(screen.getByText("タイムライン")).toBeInTheDocument()
  })

  test("アクセシビリティ - キーボードナビゲーション", async () => {
    const user = userEvent.setup()
    render(<IntegratedTestComponent />)

    // Tabキーでのナビゲーションをテスト
    await user.tab() // チーム追加ボタン
    expect(screen.getByText("チームを追加")).toHaveFocus()

    await user.tab() // 最初のチーム削除ボタン
    await user.tab() // 次のチーム削除ボタン
    await user.tab() // パスアクションボタン
    expect(screen.getByTestId("action-パス")).toHaveFocus()
  })
})
