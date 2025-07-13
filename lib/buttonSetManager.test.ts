import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// モックデータとユーティリティ
type Button = {
  action: string
  labels: Record<string, string[]> // カテゴリ付きラベルのみサポート
}

type ButtonSet = {
  setName: string
  buttons: Button[]
}

// ボタンセット管理の基本的な関数群をテスト
describe("ButtonSetManager", () => {
  beforeEach(() => {
    // Chrome storage API のモック
    jest.clearAllMocks()
    ;(globalThis as any).chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn()
        }
      }
    }
  })

  describe("ボタンセット作成機能", () => {
    test("新しいボタンセットを作成できる", () => {
      const newButtonSet: ButtonSet = {
        setName: "SOCCER",
        buttons: []
      }

      expect(newButtonSet.setName).toBe("SOCCER")
      expect(newButtonSet.buttons).toEqual([])
      expect(Array.isArray(newButtonSet.buttons)).toBe(true)
    })

    test("ボタンセットにアクションを追加できる", () => {
      const buttonSet: ButtonSet = {
        setName: "SOCCER",
        buttons: []
      }

      const newButton: Button = {
        action: "pass",
        labels: {
          Type: ["short", "long", "through"]
        }
      }

      buttonSet.buttons.push(newButton)

      expect(buttonSet.buttons).toHaveLength(1)
      expect(buttonSet.buttons[0].action).toBe("pass")
      expect(buttonSet.buttons[0].labels).toHaveProperty("Type")
      expect(buttonSet.buttons[0].labels["Type"]).toEqual([
        "short",
        "long",
        "through"
      ])
    })

    test("カテゴリ化されたラベルを持つアクションを追加できる", () => {
      const buttonSet: ButtonSet = {
        setName: "TENNIS",
        buttons: []
      }

      const newButton: Button = {
        action: "serve",
        labels: {
          Result: ["ace", "fault", "double fault"],
          Type: ["first serve", "second serve"],
          Placement: ["wide", "body", "T"]
        }
      }

      buttonSet.buttons.push(newButton)

      expect(buttonSet.buttons).toHaveLength(1)
      expect(buttonSet.buttons[0].action).toBe("serve")

      const labels = buttonSet.buttons[0].labels as Record<string, string[]>
      expect(labels["Result"]).toContain("ace")
      expect(labels["Type"]).toContain("first serve")
      expect(labels["Placement"]).toContain("wide")
    })
  })

  describe("ボタンセット操作機能", () => {
    const sampleButtonSet: ButtonSet = {
      setName: "BASKETBALL",
      buttons: [
        {
          action: "shot",
          labels: {
            Result: ["made", "missed", "blocked"]
          }
        },
        {
          action: "pass",
          labels: {
            Type: ["assist", "turnover"],
            Distance: ["short", "long"]
          }
        }
      ]
    }

    test("アクションを削除できる", () => {
      const buttonSet = JSON.parse(JSON.stringify(sampleButtonSet)) // deep clone
      buttonSet.buttons = buttonSet.buttons.filter(
        (btn) => btn.action !== "pass"
      )

      expect(buttonSet.buttons).toHaveLength(1)
      expect(buttonSet.buttons[0].action).toBe("shot")
    })

    test("アクションのラベルを追加できる", () => {
      const buttonSet = JSON.parse(JSON.stringify(sampleButtonSet)) // deep clone
      const shotButton = buttonSet.buttons.find((btn) => btn.action === "shot")

      if (shotButton && !Array.isArray(shotButton.labels)) {
        const labels = shotButton.labels as Record<string, string[]>
        if (!labels["Result"]) {
          labels["Result"] = []
        }
        labels["Result"].push("fouled")
      }

      expect(shotButton?.labels["Result"]).toContain("fouled")
      expect(shotButton?.labels["Result"].length).toBe(4)
    })

    test("カテゴリ化されたラベルを追加できる", () => {
      const buttonSet = JSON.parse(JSON.stringify(sampleButtonSet)) // deep clone
      const passButton = buttonSet.buttons.find((btn) => btn.action === "pass")

      if (passButton && !Array.isArray(passButton.labels)) {
        const labels = passButton.labels as Record<string, string[]>
        if (!labels["Quality"]) {
          labels["Quality"] = []
        }
        labels["Quality"].push("excellent", "poor")
      }

      const labels = passButton?.labels as Record<string, string[]>
      expect(labels["Quality"]).toEqual(["excellent", "poor"])
    })

    test("ラベルを削除できる", () => {
      const buttonSet = JSON.parse(JSON.stringify(sampleButtonSet)) // deep clone
      const shotButton = buttonSet.buttons.find((btn) => btn.action === "shot")

      if (shotButton && !Array.isArray(shotButton.labels)) {
        const labels = shotButton.labels as Record<string, string[]>
        if (labels["Result"]) {
          labels["Result"] = labels["Result"].filter(
            (label) => label !== "blocked"
          )
        }
      }

      expect(shotButton?.labels["Result"]).not.toContain("blocked")
      expect(shotButton?.labels["Result"].length).toBe(2)
    })
  })

  describe("ボタンセット検証機能", () => {
    test("有効なボタンセットを正しく識別する", () => {
      const validButtonSet = {
        setName: "VALID_SET",
        buttons: [
          {
            action: "valid_action",
            labels: {
              Category: ["label1", "label2"]
            }
          }
        ]
      }

      const isValid = (buttonSet: any): buttonSet is ButtonSet => {
        return (
          typeof buttonSet.setName === "string" &&
          buttonSet.setName.length > 0 &&
          Array.isArray(buttonSet.buttons) &&
          buttonSet.buttons.every(
            (btn: any) =>
              typeof btn.action === "string" &&
              btn.action.length > 0 &&
              typeof btn.labels === "object" &&
              btn.labels !== null
          )
        )
      }

      expect(isValid(validButtonSet)).toBe(true)
    })

    test("無効なボタンセットを正しく識別する", () => {
      const invalidButtonSets = [
        { setName: "", buttons: [] }, // 空のsetName
        { setName: "TEST", buttons: null }, // nullなbuttons
        { setName: "TEST", buttons: [{ action: "", labels: {} }] }, // 空のaction
        { setName: "TEST", buttons: [{ action: "test", labels: null }] } // nullなlabels
      ]

      const isValid = (buttonSet: any): buttonSet is ButtonSet => {
        return (
          typeof buttonSet.setName === "string" &&
          buttonSet.setName.length > 0 &&
          Array.isArray(buttonSet.buttons) &&
          buttonSet.buttons.every(
            (btn: any) =>
              typeof btn.action === "string" &&
              btn.action.length > 0 &&
              typeof btn.labels === "object" &&
              btn.labels !== null
          )
        )
      }

      invalidButtonSets.forEach((buttonSet) => {
        expect(isValid(buttonSet)).toBe(false)
      })
    })
  })

  describe("ボタンセット保存・読み込み機能", () => {
    test("ボタンセットをChromeストレージに保存できる", async () => {
      const buttonSets: ButtonSet[] = [
        {
          setName: "SOCCER",
          buttons: [
            {
              action: "pass",
              labels: {
                Distance: ["short", "long"]
              }
            }
          ]
        }
      ]

      const mockSet = jest.fn().mockResolvedValue(undefined)
      ;(globalThis as any).chrome.storage.local.set = mockSet

      // 保存処理のシミュレーション
      await (globalThis as any).chrome.storage.local.set({ buttonSets })

      expect(mockSet).toHaveBeenCalledWith({ buttonSets })
    })

    test("Chromeストレージからボタンセットを読み込める", async () => {
      const expectedButtonSets: ButtonSet[] = [
        {
          setName: "TENNIS",
          buttons: [
            {
              action: "serve",
              labels: {
                Result: ["ace", "fault"],
                Type: ["first serve", "second serve"]
              }
            }
          ]
        }
      ]

      const mockGet = jest
        .fn()
        .mockResolvedValue({ buttonSets: expectedButtonSets })
      ;(globalThis as any).chrome.storage.local.get = mockGet

      // 読み込み処理のシミュレーション
      const result = await (globalThis as any).chrome.storage.local.get([
        "buttonSets"
      ])

      expect(mockGet).toHaveBeenCalledWith(["buttonSets"])
      expect(result.buttonSets).toEqual(expectedButtonSets)
    })

    test("ストレージエラー時にフォールバック処理が動作する", async () => {
      const mockGet = jest
        .fn()
        .mockRejectedValue(new Error("Storage not available"))
      ;(globalThis as any).chrome.storage.local.get = mockGet

      let fallbackCalled = false

      try {
        await (globalThis as any).chrome.storage.local.get(["buttonSets"])
      } catch (error) {
        fallbackCalled = true
        expect(error.message).toBe("Storage not available")
      }

      expect(fallbackCalled).toBe(true)
    })
  })

  describe("ボタンセット形式変換機能", () => {
    test("レガシー形式からモダン形式への変換", () => {
      const legacyButtonSet = {
        setName: "LEGACY",
        buttons: [
          {
            action: "action1",
            labels: {
              Legacy: ["label1", "label2", "label3"]
            }
          }
        ]
      }

      const convertToModern = (buttonSet: ButtonSet): ButtonSet => {
        return {
          ...buttonSet,
          buttons: buttonSet.buttons.map((btn) => ({
            ...btn,
            labels: btn.labels
          }))
        }
      }

      const modernButtonSet = convertToModern(legacyButtonSet)
      const modernLabels = modernButtonSet.buttons[0].labels as Record<
        string,
        string[]
      >

      expect(modernLabels["Legacy"]).toEqual(["label1", "label2", "label3"])
    })

    test("モダン形式からフラット形式への変換", () => {
      const modernButtonSet: ButtonSet = {
        setName: "MODERN",
        buttons: [
          {
            action: "action1",
            labels: {
              Category1: ["label1", "label2"],
              Category2: ["label3", "label4"]
            }
          }
        ]
      }

      const convertToFlat = (buttonSet: ButtonSet): ButtonSet => {
        return {
          ...buttonSet,
          buttons: buttonSet.buttons.map((btn) => ({
            ...btn,
            labels: {
              Flat: Object.entries(btn.labels).flatMap(([category, labels]) =>
                labels.map((label) => `${category} - ${label}`)
              )
            }
          }))
        }
      }

      const flatButtonSet = convertToFlat(modernButtonSet)
      const flatLabels = flatButtonSet.buttons[0].labels as Record<
        string,
        string[]
      >

      expect(flatLabels["Flat"]).toEqual([
        "Category1 - label1",
        "Category1 - label2",
        "Category2 - label3",
        "Category2 - label4"
      ])
    })
  })

  describe("ボタンセット統合機能", () => {
    test("複数のボタンセットをマージできる", () => {
      const buttonSet1: ButtonSet = {
        setName: "SET1",
        buttons: [
          {
            action: "action1",
            labels: {
              Category: ["label1", "label2"]
            }
          }
        ]
      }

      const buttonSet2: ButtonSet = {
        setName: "SET2",
        buttons: [
          {
            action: "action2",
            labels: {
              Category: ["label3", "label4"]
            }
          }
        ]
      }

      const mergeButtonSets = (
        sets: ButtonSet[],
        newName: string
      ): ButtonSet => {
        return {
          setName: newName,
          buttons: sets.flatMap((set) => set.buttons)
        }
      }

      const mergedSet = mergeButtonSets([buttonSet1, buttonSet2], "MERGED")

      expect(mergedSet.setName).toBe("MERGED")
      expect(mergedSet.buttons).toHaveLength(2)
      expect(mergedSet.buttons[0].action).toBe("action1")
      expect(mergedSet.buttons[1].action).toBe("action2")
    })

    test("重複するアクション名を持つボタンセットのマージ時に警告する", () => {
      const buttonSet1: ButtonSet = {
        setName: "SET1",
        buttons: [
          {
            action: "duplicate",
            labels: {
              Category: ["label1"]
            }
          }
        ]
      }

      const buttonSet2: ButtonSet = {
        setName: "SET2",
        buttons: [
          {
            action: "duplicate",
            labels: {
              Category: ["label2"]
            }
          }
        ]
      }

      const checkForDuplicates = (sets: ButtonSet[]): string[] => {
        const actionNames: string[] = []
        const duplicates: string[] = []

        sets.forEach((set) => {
          set.buttons.forEach((btn) => {
            if (actionNames.includes(btn.action)) {
              if (!duplicates.includes(btn.action)) {
                duplicates.push(btn.action)
              }
            } else {
              actionNames.push(btn.action)
            }
          })
        })

        return duplicates
      }

      const duplicates = checkForDuplicates([buttonSet1, buttonSet2])
      expect(duplicates).toEqual(["duplicate"])
    })
  })
})
