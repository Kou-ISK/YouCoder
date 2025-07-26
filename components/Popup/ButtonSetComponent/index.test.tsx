import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import ButtonSetComponent from "."

// MockButtonSet型の定義
type MockButton = {
  action: string
  labels: Record<string, string[]> // カテゴリ付きラベルのみサポート
}

type MockButtonSet = {
  setName: string
  buttons: MockButton[]
}

// テスト用のモックデータ
const mockButtonSetWithLabels: MockButtonSet = {
  setName: "サッカー基本セット",
  buttons: [
    {
      action: "パス",
      labels: {
        方向: ["前", "後", "左", "右"],
        精度: ["正確", "不正確"],
        Result: ["良い", "普通"]
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
      labels: {
        スピード: ["速い", "遅い"],
        スタイル: ["テクニカル"]
      }
    },
    {
      action: "シュート",
      labels: {
        結果: ["成功", "失敗"],
        状況: ["ブロック"]
      }
    }
  ]
}

const mockEmptyButtonSet: MockButtonSet = {
  setName: "空のセット",
  buttons: []
}

describe("ButtonSetComponent", () => {
  const defaultProps = {
    buttonSet: mockButtonSetWithLabels,
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

  test("カテゴリ化されたラベルが正しく表示される", async () => {
    const user = userEvent.setup()

    // 選択されたアクション状態をシミュレート
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    // カテゴリ名が表示されることを確認
    expect(screen.getByText("🏷️ 方向")).toBeInTheDocument()
    expect(screen.getByText("🏷️ 精度")).toBeInTheDocument()
    expect(screen.getByText("🏷️ Result")).toBeInTheDocument()

    // ラベルが表示されることを確認
    expect(screen.getByText("前")).toBeInTheDocument()
    expect(screen.getByText("正確")).toBeInTheDocument()
    expect(screen.getByText("良い")).toBeInTheDocument()
  })

  test("カテゴリ付きラベルが正しく表示される（旧フラット形式のデータ構造更新）", async () => {
    // ドリブルアクションが選択された状態をテスト
    const { rerender } = render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={mockButtonSetWithFlatLabels}
        selectedAction="ドリブル"
      />
    )

    // ドリブルアクションのカテゴリ付きラベルが表示されることを確認
    expect(screen.getByText("速い")).toBeInTheDocument()
    expect(screen.getByText("遅い")).toBeInTheDocument()
    expect(screen.getByText("テクニカル")).toBeInTheDocument()

    // シュートアクションが選択された状態に変更
    rerender(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={mockButtonSetWithFlatLabels}
        selectedAction="シュート"
      />
    )

    // シュートアクションのカテゴリ付きラベルが表示されることを確認
    expect(screen.getByText("成功")).toBeInTheDocument()
    expect(screen.getByText("失敗")).toBeInTheDocument()
    expect(screen.getByText("ブロック")).toBeInTheDocument()
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

  test("選択されていないアクションのラベルボタンは無効状態になる", async () => {
    // シュートアクションが選択されている状態
    render(<ButtonSetComponent {...defaultProps} selectedAction="シュート" />)

    // シュートアクションのラベルが表示されることを確認
    expect(screen.getByText("ゴール")).toBeInTheDocument()

    // シュートアクションのラベルボタンが無効状態であることを確認
    const goalButton = screen.getByText("ゴール").closest("button")
    expect(goalButton).toBeInTheDocument()
    expect(goalButton).toHaveClass("opacity-50", "cursor-not-allowed")
    expect(goalButton).toBeDisabled()

    // パスアクションのラベルは表示されないことを確認（選択されていないため）
    expect(screen.queryByText("前")).not.toBeInTheDocument()
  })

  test("ラベルボタンは読み取り専用で、クリックしてもonUpdateButtonSetが呼ばれない", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} selectedAction="パス" />)

    const labelButton = screen.getByText("前")
    await user.click(labelButton)

    // onUpdateButtonSetは呼ばれない（読み取り専用モード）
    expect(defaultProps.onUpdateButtonSet).not.toHaveBeenCalled()
  })

  test("カテゴリ付きラベルは読み取り専用で、クリックしてもonUpdateButtonSetが呼ばれない", async () => {
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

    // onUpdateButtonSetは呼ばれない（読み取り専用モード）
    expect(mockOnUpdateButtonSet).not.toHaveBeenCalled()
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
          labels: {}
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

  test("長いアクション名とラベル名が適切に表示される", async () => {
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
        selectedAction="とても長いアクション名をテストするためのアクション"
      />
    )

    // アクション名が表示されることを確認
    expect(
      screen.getByText("とても長いアクション名をテストするためのアクション")
    ).toBeInTheDocument()

    // 長いカテゴリ名とラベル名が表示されることを確認
    expect(screen.getByText("🏷️ とても長いカテゴリ名")).toBeInTheDocument()
    expect(
      screen.getByText("とても長いラベル名をテストするためのラベル")
    ).toBeInTheDocument()
  })

  test("特殊文字を含むラベルが正しく処理される", async () => {
    const buttonSetWithSpecialChars: MockButtonSet = {
      setName: "特殊文字セット",
      buttons: [
        {
          action: "特殊アクション",
          labels: {
            記号: ["@#$%", "あいうえお", "123"],
            General: ["normal-label", "under_score"]
          }
        }
      ]
    }

    render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={buttonSetWithSpecialChars}
        selectedAction="特殊アクション"
      />
    )

    // 特殊文字を含むラベルが表示されることを確認
    expect(screen.getByText("@#$%")).toBeInTheDocument()
    expect(screen.getByText("あいうえお")).toBeInTheDocument()
    expect(screen.getByText("123")).toBeInTheDocument()
    expect(screen.getByText("normal-label")).toBeInTheDocument()
    expect(screen.getByText("under_score")).toBeInTheDocument()
  })

  test("ラベル形式の正規化が正しく動作する", async () => {
    // カテゴリ付きラベルのみをサポート
    const mixedButtonSet: MockButtonSet = {
      setName: "混在セット",
      buttons: [
        {
          action: "カテゴリなし",
          labels: {} // 空のカテゴリ
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

    render(
      <ButtonSetComponent
        {...defaultProps}
        buttonSet={mixedButtonSet}
        selectedAction="カテゴリ"
      />
    )

    // フラット形式のラベルは表示されない（カテゴリなしラベルのサポート削除）
    expect(screen.queryByText("ラベル1")).not.toBeInTheDocument()
    expect(screen.queryByText("ラベル2")).not.toBeInTheDocument()

    // カテゴリ形式のラベルは表示される
    expect(screen.getByText("🏷️ カテゴリA")).toBeInTheDocument()
    expect(screen.getByText("ラベルA1")).toBeInTheDocument()
    expect(screen.getByText("🏷️ カテゴリB")).toBeInTheDocument()
    expect(screen.getByText("ラベルB1")).toBeInTheDocument()
  })

  test("アクションボタンのホバー効果", async () => {
    const user = userEvent.setup()
    render(<ButtonSetComponent {...defaultProps} />)

    // "パス"テキストを含むボタン要素を取得
    const passButton = screen.getByRole("button", { name: /パス/ })

    // 非アクティブ状態ではwhiteのbackgroundクラスが適用されることを確認
    expect(passButton).toHaveClass("bg-white")

    // ホバーイベントが発生することを確認
    await user.hover(passButton)
    expect(passButton).toBeInTheDocument()
  })

  test("選択状態の変更時に正しいログ出力が行われる", async () => {
    // logger.debugをモック
    const loggerSpy = jest
      .spyOn(require("../../../utils/errorHandling").logger, "debug")
      .mockImplementation(() => {})
    const user = userEvent.setup()

    render(<ButtonSetComponent {...defaultProps} />)

    const passButton = screen.getByText("パス")
    await user.click(passButton)

    // ログ出力の確認
    expect(loggerSpy).toHaveBeenCalledWith(
      "ButtonSetComponent: Action clicked",
      expect.objectContaining({
        action: "パス",
        currentSelection: null,
        newSelection: "パス"
      })
    )

    loggerSpy.mockRestore()
  })

  test("ラベルは読み取り専用で削除機能はない", async () => {
    const user = userEvent.setup()
    const mockOnUpdateButtonSet = jest.fn()

    render(
      <ButtonSetComponent
        {...defaultProps}
        selectedAction="パス"
        onUpdateButtonSet={mockOnUpdateButtonSet}
      />
    )

    // ラベルボタンをクリックしても何も起こらない（読み取り専用）
    const labelButton = screen.getByText("前")
    await user.click(labelButton)

    expect(mockOnUpdateButtonSet).not.toHaveBeenCalled()
  })
})
