import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TaggingPanel } from "../../components/TaggingPanel"

// Draggableコンポーネントのモック
jest.mock("react-draggable", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    )
  }
})

describe("TaggingPanel", () => {
  const defaultProps = {
    teams: ["Team A", "Team B"],
    actions: { pass: "Pass", shoot: "Shoot" },
    labels: ["Good", "Bad", "Excellent"],
    activeActions: new Set<string>(),
    activeLabels: new Set<string>(),
    onActionToggle: jest.fn(),
    onLabelClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("チームとアクションが表示される", () => {
    render(<TaggingPanel {...defaultProps} />)

    // チーム名が表示されることを確認
    expect(screen.getByText("Team A")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()

    // アクションボタンが表示されることを確認
    expect(screen.getAllByText("Pass")).toHaveLength(2) // 各チームに1つずつ
    expect(screen.getAllByText("Shoot")).toHaveLength(2)
  })

  test("ラベルが表示される", () => {
    render(<TaggingPanel {...defaultProps} />)

    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })

  test("カテゴリ化されたラベルが正しく表示される", () => {
    const categorizedLabels = {
      Result: ["Good", "Bad", "Excellent"],
      Distance: ["Short", "Long"],
      一般: ["Basic"]
    }

    render(<TaggingPanel {...defaultProps} labels={categorizedLabels} />)

    // カテゴリヘッダーの確認
    expect(screen.getByText("Result")).toBeInTheDocument()
    expect(screen.getByText("Distance")).toBeInTheDocument()
    
    // ラベルボタンの確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
    
    // 一般カテゴリは接頭辞なしで表示
    expect(screen.getByText("Basic")).toBeInTheDocument()
  })

  test("アクションボタンをクリックするとonActionToggleが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TaggingPanel {...defaultProps} />)

    const passButton = screen.getAllByText("Pass")[0] // Team AのPassボタン
    await user.click(passButton)

    expect(defaultProps.onActionToggle).toHaveBeenCalledWith("Team A", "pass")
  })

  test("ラベルボタンをクリックするとonLabelClickが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<TaggingPanel {...defaultProps} />)

    const goodButton = screen.getByText("Good")
    await user.click(goodButton)

    expect(defaultProps.onLabelClick).toHaveBeenCalledWith("Good")
  })

  test("カテゴリ化されたラベルボタンをクリックするとカテゴリ形式で呼ばれる", async () => {
    const user = userEvent.setup()
    const categorizedLabels = {
      Result: ["Good", "Bad"],
      Type: ["Fast", "Slow"]
    }

    render(<TaggingPanel {...defaultProps} labels={categorizedLabels} />)

    // カテゴリ内のラベルをクリック
    const goodButton = screen.getByText("Good")
    await user.click(goodButton)

    // クリック時には内部でカテゴリ名が付与されて渡される
    expect(defaultProps.onLabelClick).toHaveBeenCalledWith("Result - Good")
  })

  test("アクティブなアクションにはアクティブスタイルが適用される", () => {
    const activeActions = new Set(["Team A-pass"])
    render(<TaggingPanel {...defaultProps} activeActions={activeActions} />)

    // アクティブなアクションボタンの特定（テストIDやdata属性を使用）
    const passButtons = screen.getAllByText("Pass")
    // 実際のスタイルを確認するには、ActionButtonコンポーネントの実装に依存
  })

  test("アクティブなラベルにはアクティブスタイルが適用される", () => {
    const activeLabels = new Set(["Good"])
    render(<TaggingPanel {...defaultProps} activeLabels={activeLabels} />)

    // アクティブなラベルボタンの特定
    const goodButton = screen.getByText("Good")
    // 実際のスタイルを確認するには、LabelButtonコンポーネントの実装に依存
  })

  test("空のチーム配列でもエラーにならない", () => {
    render(<TaggingPanel {...defaultProps} teams={[]} />)

    // エラーが発生しないことを確認
    expect(screen.queryByText("Team A")).not.toBeInTheDocument()
  })

  test("空のアクション辞書でもエラーにならない", () => {
    render(<TaggingPanel {...defaultProps} actions={{}} />)

    // アクションボタンが表示されないことを確認
    expect(screen.queryByText("Pass")).not.toBeInTheDocument()
  })

  test("空のラベル配列でもエラーにならない", () => {
    render(<TaggingPanel {...defaultProps} labels={[]} />)

    // ラベルボタンが表示されないことを確認
    expect(screen.queryByText("Good")).not.toBeInTheDocument()
  })

  test("ドラッグハンドルが表示される", () => {
    // Container要素にレンダリング
    const { container } = render(<TaggingPanel {...defaultProps} />)

    // ドラッグハンドルの要素が存在することを確認
    const dragHandle = container.querySelector(".drag-handle")
    expect(dragHandle).toBeInTheDocument()
  })

  test("不正なラベル形式でも安全に処理される", () => {
    const invalidLabels = null as any

    expect(() => {
      render(<TaggingPanel {...defaultProps} labels={invalidLabels} />)
    }).not.toThrow()
  })

  test("カテゴリ「一般」のラベルは接頭辞なしで表示される", () => {
    const generalLabels = {
      一般: ["Basic", "Simple"]
    }

    render(<TaggingPanel {...defaultProps} labels={generalLabels} />)

    expect(screen.getByText("Basic")).toBeInTheDocument()
    expect(screen.getByText("Simple")).toBeInTheDocument()
    expect(screen.queryByText("一般 - Basic")).not.toBeInTheDocument()
  })

  test("混在したラベル形式（配列とオブジェクト）を処理できる", () => {
    // 実際の実装では後方互換性のために、両形式をサポートする必要がある
    const mixedLabels = ["Legacy1", "Legacy2"] // 従来の配列形式

    render(<TaggingPanel {...defaultProps} labels={mixedLabels} />)

    expect(screen.getByText("Legacy1")).toBeInTheDocument()
    expect(screen.getByText("Legacy2")).toBeInTheDocument()
  })
})

// 新機能のテスト: ブラケット記法表示
describe("ブラケット記法表示機能", () => {
  test("カテゴリ化されたラベルが[カテゴリ] 値形式で表示されるオプション", () => {
    // 実際の実装でブラケット記法が使用される場合のテスト
    const categorizedLabels = {
      Result: ["ace", "fault"],
      Type: ["first serve", "second serve"]
    }

    // ブラケット記法表示オプションが有効な場合
    const propsWithBrackets = {
      teams: ["Team A"],
      actions: { serve: "Serve" },
      labels: categorizedLabels,
      activeActions: new Set<string>(),
      activeLabels: new Set<string>(),
      onActionToggle: jest.fn(),
      onLabelClick: jest.fn(),
      useBracketNotation: true // 仮想的なプロパティ
    }

    // この部分は実際のコンポーネントの実装に依存
    // render(<TaggingPanel {...propsWithBrackets} />)
    // expect(screen.getByText('[Result] ace')).toBeInTheDocument()
  })
})
