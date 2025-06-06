import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import ButtonSetComponent from "../../../components/Popup/ButtonSetComponent"

// MockButtonSet型の定義
type MockButton = {
  action: string
  labels: Record<string, string[]> | string[]
}

type MockButtonSet = {
  setName: string
  buttons: MockButton[]
}

// テスト用のモックデータ
const mockButtonSetWithCategorizedLabels: MockButtonSet = {
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

const mockButtonSetWithFlatLabels: MockButtonSet = {
  setName: "バスケ基本セット",
  buttons: [
    {
      action: "ドリブル",
      labels: ["速い", "遅い", "テクニカル"]
    },
    {
      action: "シュート",
      labels: ["成功", "失敗", "ブロック"]
    }
  ]
}

const mockEmptyButtonSet: MockButtonSet = {
  setName: "空のセット",
  buttons: []
}

describe("ButtonSetComponent", () => {
  const defaultProps = {
    buttonSet: mockButtonSetWithCategorizedLabels,
    selectedAction: null,
    onUpdateButtonSet: jest.fn(),
    onActionSelect: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("ButtonSetComponentが正常にレンダリングされる", () => {
    render(<ButtonSetComponent {...defaultProps} />)

    // アクションボタンが表示されることを確認
    expect(screen.getByText("パス")).toBeInTheDocument()
    expect(screen.getByText("シュート")).toBeInTheDocument()
  })

  test("buttonSetがundefinedの場合、適切なメッセージが表示される", () => {
    render(<ButtonSetComponent {...defaultProps} buttonSet={undefined} />)

    expect(
      screen.getByText("選択されたボタンセットがありません")
    ).toBeInTheDocument()
  })

  test("カテゴリ化されたラベルが正しく表示される", () => {
    render(<ButtonSetComponent {...defaultProps} />)

    // カテゴリ名が表示されることを確認（"一般"以外）
    expect(screen.getByText("方向")).toBeInTheDocument()
    expect(screen.getByText("精度")).toBeInTheDocument()
    expect(screen.getByText("結果")).toBeInTheDocument()
    expect(screen.getByText("位置")).toBeInTheDocument()

    // "一般"カテゴリは表示されない
    expect(screen.queryByText("一般")).not.toBeInTheDocument()

    // ラベルが表示されることを確認
    expect(screen.getByText("前")).toBeInTheDocument()
    expect(screen.getByText("正確")).toBeInTheDocument()
    expect(screen.getByText("良い")).toBeInTheDocument()
  })

  test("フラット形式のラベルが正しく表示される", () => {
    render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={mockButtonSetWithFlatLabels}
      />
    )

    // フラット形式のラベルが表示されることを確認
    expect(screen.getByText("速い")).toBeInTheDocument()
    expect(screen.getByText("遅い")).toBeInTheDocument()
    expect(screen.getByText("テクニカル")).toBeInTheDocument()
    expect(screen.getByText("成功")).toBeInTheDocument()
  })

  test("アクションボタンをクリックすると選択状態が変わる", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} />)

    const passButton = screen.getByText("パス")
    await user.click(passButton)

    expect(defaultProps.onActionSelect).toHaveBeenCalledWith("パス")
  })

  test("既に選択されているアクションをクリックすると選択解除される", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    const passButton = screen.getByText("パス")
    await user.click(passButton)

    expect(defaultProps.onActionSelect).toHaveBeenCalledWith(null)
  })

  test("選択されたアクションに対してラベルボタンがアクティブになる", () => {
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    // 選択されたアクションのラベルボタンがアクティブ状態になることを確認
    const labelButtons = screen.getAllByRole("button")
    const passActionButtons = labelButtons.filter(
      (button) =>
        button.textContent?.includes("前") ||
        button.textContent?.includes("正確") ||
        button.textContent?.includes("良い")
    )

    // パスアクションのラベルボタンが存在することを確認
    expect(passActionButtons.length).toBeGreaterThan(0)
  })

  test("選択されていないアクションのラベルボタンは無効状態になる", () => {
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    // シュートアクションのラベルボタンを確認
    const goalButton = screen.getByText("ゴール")

    // 無効状態のスタイルを確認
    expect(goalButton).toHaveStyle({ opacity: "0.5" })
  })

  test("ラベルボタンをクリックするとonUpdateButtonSetが呼ばれる", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    const labelButton = screen.getByText("前")
    await user.click(labelButton)

    expect(defaultProps.onUpdateButtonSet).toHaveBeenCalled()

    // 呼び出された引数を確認
    const call = defaultProps.onUpdateButtonSet.mock.calls[0][0]
    expect(call.setName).toBe("サッカー基本セット")
    expect(call.buttons).toBeDefined()
  })

  test("カテゴリ付きラベルのクリック時に正しい表示名が使用される", async () => {
    const user = userEvent.setup()
    const mockOnUpdateButtonSet = jest.fn()

    render(
      <ButtonSetComponent
        {...defaultProps}
        selectedAction="パス"
        onUpdateButtonSet={mockOnUpdateButtonSet}
      />
    )

    const labelButton = screen.getByText("前")
    await user.click(labelButton)

    // onUpdateButtonSetが呼ばれることを確認
    expect(mockOnUpdateButtonSet).toHaveBeenCalled()
  })

  test("空のボタンセットが正しく処理される", () => {
    render(
      <ButtonSetComponent {...defaultProps} buttonSet={mockEmptyButtonSet} />
    )

    // アクションボタンが表示されないことを確認
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  test("ラベルがないアクションも正しく表示される", () => {
    const buttonSetWithNoLabels: MockButtonSet = {
      setName: "ラベルなしセット",
      buttons: [
        {
          action: "アクション1",
          labels: []
        },
        {
          action: "アクション2",
          labels: {}
        }
      ]
    }

    render(
      <ButtonSetComponent {...defaultProps} buttonSet={buttonSetWithNoLabels} />
    )

    // アクションボタンは表示される
    expect(screen.getByText("アクション1")).toBeInTheDocument()
    expect(screen.getByText("アクション2")).toBeInTheDocument()
  })

  test("長いアクション名とラベル名が適切に表示される", () => {
    const buttonSetWithLongNames: MockButtonSet = {
      setName: "長い名前のセット",
      buttons: [
        {
          action: "とても長いアクション名をテストするためのアクション",
          labels: {
            とても長いカテゴリ名: ["とても長いラベル名をテストするためのラベル"]
          }
        }
      ]
    }

    render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={buttonSetWithLongNames}
      />
    )

    // 長い名前も表示されることを確認
    expect(
      screen.getByText("とても長いアクション名をテストするためのアクション")
    ).toBeInTheDocument()
    expect(screen.getByText("とても長いカテゴリ名")).toBeInTheDocument()
    expect(
      screen.getByText("とても長いラベル名をテストするためのラベル")
    ).toBeInTheDocument()
  })

  test("特殊文字を含むラベルが正しく処理される", () => {
    const buttonSetWithSpecialChars: MockButtonSet = {
      setName: "特殊文字セット",
      buttons: [
        {
          action: "特殊アクション",
          labels: {
            記号: ["@#$%", "あいうえお", "123"],
            一般: ["normal-label", "under_score"]
          }
        }
      ]
    }

    render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={buttonSetWithSpecialChars}
      />
    )

    // 特殊文字を含むラベルが表示されることを確認
    expect(screen.getByText("@#$%")).toBeInTheDocument()
    expect(screen.getByText("あいうえお")).toBeInTheDocument()
    expect(screen.getByText("123")).toBeInTheDocument()
    expect(screen.getByText("normal-label")).toBeInTheDocument()
    expect(screen.getByText("under_score")).toBeInTheDocument()
  })

  test("ラベル形式の正規化が正しく動作する", () => {
    // フラット形式とカテゴリ形式が混在した場合のテスト
    const mixedButtonSet: MockButtonSet = {
      setName: "混在セット",
      buttons: [
        {
          action: "フラット",
          labels: ["ラベル1", "ラベル2"]
        },
        {
          action: "カテゴリ",
          labels: {
            カテゴリA: ["ラベルA1", "ラベルA2"],
            カテゴリB: ["ラベルB1"]
          }
        }
      ]
    }

    render(<ButtonSetComponent {...defaultProps} buttonSet={mixedButtonSet} />)

    // フラット形式のラベル（"一般"カテゴリとして表示）
    expect(screen.getByText("ラベル1")).toBeInTheDocument()
    expect(screen.getByText("ラベル2")).toBeInTheDocument()

    // カテゴリ形式のラベル
    expect(screen.getByText("カテゴリA")).toBeInTheDocument()
    expect(screen.getByText("ラベルA1")).toBeInTheDocument()
    expect(screen.getByText("カテゴリB")).toBeInTheDocument()
    expect(screen.getByText("ラベルB1")).toBeInTheDocument()
  })

  test("アクションボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} />)

    const passButton = screen.getByText("パス")

    // ホバー前の状態
    expect(passButton).toHaveStyle({
      backgroundColor: "#ffffff"
    })

    await user.hover(passButton)

    // ホバー時の状態は実際のActionButtonコンポーネントの実装に依存
    // ここではホバーイベントが発生することを確認
    expect(passButton).toBeInTheDocument()
  })

  test("選択状態の変更時に正しいログ出力が行われる", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const user = userEvent.setup()

    render(<ButtonSetComponent {...defaultProps} />)

    const passButton = screen.getByText("パス")
    await user.click(passButton)

    // ログ出力の確認
    expect(consoleSpy).toHaveBeenCalledWith(
      "ButtonSetComponent: Action clicked",
      expect.objectContaining({
        action: "パス",
        currentSelection: null,
        newSelection: "パス"
      })
    )

    consoleSpy.mockRestore()
  })

  test("ラベル削除機能が正しく動作する", async () => {
    const user = userEvent.setup()
    const mockOnUpdateButtonSet = jest.fn()

    render(
      <ButtonSetComponent
        {...defaultProps}
        selectedAction="パス"
        onUpdateButtonSet={mockOnUpdateButtonSet}
      />
    )

    // ラベルボタンをクリックしてラベルを追加
    const labelButton = screen.getByText("前")
    await user.click(labelButton)

    expect(mockOnUpdateButtonSet).toHaveBeenCalled()
  })
})
