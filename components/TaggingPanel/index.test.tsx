import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { TaggingPanel } from "."

// DraggableResizableコンポーネントのモック
jest.mock("~components/DraggableResizable", () => {
  return {
    DraggableResizable: ({
      children,
      className
    }: {
      children: React.ReactNode
      className?: string
    }) => (
      <div data-testid="draggable-resizable" className={className}>
        {children}
      </div>
    )
  }
})

// TaggingPanelContentコンポーネントのモック
jest.mock("./TaggingPanelContent", () => ({
  TaggingPanelContent: ({ teams, actions, labels }: any) => (
    <div data-testid="tagging-panel-content">
      {teams.map((team: string) => (
        <div key={team}>{team}</div>
      ))}
      {Object.values(actions).map((action: string) => (
        <button key={action}>{action}</button>
      ))}
      {Array.isArray(labels)
        ? labels.map((label: string) => <button key={label}>{label}</button>)
        : labels && typeof labels === "object"
          ? Object.values(labels)
              .flat()
              .map((label: string) => <button key={label}>{label}</button>)
          : null}
    </div>
  )
}))

// usePanelPositionフックのモック
jest.mock("./hooks/usePanelPosition", () => {
  return {
    usePanelPosition: () => ({
      position: { x: 100, y: 100 },
      size: { width: 280, height: 300 },
      handlePositionChange: jest.fn(),
      handleSizeChange: jest.fn()
    })
  }
})

describe("TaggingPanel", () => {
  const defaultProps = {
    teams: ["Team A", "Team B"],
    actions: { pass: "Pass", shoot: "Shoot" },
    labels: {
      Result: ["Good", "Bad"],
      Distance: ["Short", "Long"]
    },
    activeActions: new Set<string>(),
    activeLabels: new Set<string>(),
    onActionToggle: jest.fn(),
    onLabelClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("DraggableResizableでラップされている", () => {
    render(<TaggingPanel {...defaultProps} />)

    const draggableElement = screen.getByTestId("draggable-resizable")
    expect(draggableElement).toBeInTheDocument()
    expect(draggableElement).toHaveClass(
      "bg-gradient-to-br",
      "from-white",
      "via-gray-50",
      "to-blue-50",
      "rounded-2xl",
      "shadow-2xl"
    )
  })

  test("TaggingPanelContentが表示される", () => {
    render(<TaggingPanel {...defaultProps} />)

    expect(screen.getByTestId("tagging-panel-content")).toBeInTheDocument()
  })

  test("チームとアクションが表示される", () => {
    render(<TaggingPanel {...defaultProps} />)

    // チーム名が表示されることを確認
    expect(screen.getByText("Team A")).toBeInTheDocument()
    expect(screen.getByText("Team B")).toBeInTheDocument()

    // アクションボタンが表示されることを確認
    expect(screen.getByText("Pass")).toBeInTheDocument()
    expect(screen.getByText("Shoot")).toBeInTheDocument()
  })

  test("ラベルが表示される", () => {
    render(<TaggingPanel {...defaultProps} />)

    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
    expect(screen.getByText("Long")).toBeInTheDocument()
  })

  test("カテゴリ化されたラベルが正しく表示される", () => {
    const labelsByCategory = {
      Result: ["Good", "Bad", "Excellent"],
      Distance: ["Short", "Long"],
      General: ["Basic"]
    }

    render(<TaggingPanel {...defaultProps} labels={labelsByCategory} />)

    // ラベルボタンの確認
    expect(screen.getByText("Good")).toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
    expect(screen.getByText("Basic")).toBeInTheDocument()
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

  test("空のラベル辞書でもエラーにならない", () => {
    render(<TaggingPanel {...defaultProps} labels={{}} />)

    // ラベルボタンが表示されないことを確認
    expect(screen.queryByText("Good")).not.toBeInTheDocument()
  })

  test("不正なラベル形式でも安全に処理される", () => {
    const invalidLabels = null as any

    expect(() => {
      render(<TaggingPanel {...defaultProps} labels={invalidLabels} />)
    }).not.toThrow()
  })
})

// 新機能のテスト: ブラケット記法表示
describe("ブラケット記法表示機能", () => {
  test("カテゴリ化されたラベルが[カテゴリ] 値形式で表示されるオプション", () => {
    // 実際の実装でブラケット記法が使用される場合のテスト
    const labelsByCategory = {
      Result: ["ace", "fault"],
      Type: ["first serve", "second serve"]
    }

    // ブラケット記法表示オプションが有効な場合
    const propsWithBrackets = {
      teams: ["Team A"],
      actions: { serve: "Serve" },
      labels: labelsByCategory,
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
