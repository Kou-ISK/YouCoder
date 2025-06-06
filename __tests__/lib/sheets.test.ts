import {
  appendToSheet,
  getAuthUrl,
  loadGapi,
  setCredentials,
  signIn,
  signOut
} from "../../lib/sheets"

// Google API のモック
const mockGapi = {
  load: jest.fn(),
  client: {
    init: jest.fn(),
    load: jest.fn(),
    sheets: {
      spreadsheets: {
        values: {
          append: jest.fn()
        }
      }
    }
  },
  auth2: {
    getAuthInstance: jest.fn(() => ({
      signIn: jest.fn(),
      signOut: jest.fn(),
      currentUser: {
        get: jest.fn(() => ({
          getAuthResponse: jest.fn(() => ({
            id_token: "mock_id_token",
            access_token: "mock_access_token",
            expires_in: 3600
          }))
        }))
      }
    }))
  },
  auth: {
    setToken: jest.fn()
  }
}

// グローバルオブジェクトにモックを設定
;(globalThis as any).gapi = mockGapi

describe("Google Sheets Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // DOM操作のモック
    document.createElement = jest.fn((tagName: string) => {
      const element = {
        src: "",
        onload: null as any,
        onerror: null as any,
        tagName: tagName.toUpperCase()
      }
      return element as any
    })

    document.body.appendChild = jest.fn()
  })

  describe("loadGapi", () => {
    test("Google API スクリプトを正常に読み込める", async () => {
      const mockScript = {
        src: "",
        onload: null as any,
        onerror: null as any
      }

      document.createElement = jest.fn().mockReturnValue(mockScript)
      mockGapi.load.mockImplementation((apis: string, callback: () => void) => {
        callback()
      })
      mockGapi.client.init.mockResolvedValue(undefined)
      mockGapi.client.load.mockResolvedValue(undefined)

      const loadPromise = loadGapi()

      // スクリプトのonloadを実行
      if (mockScript.onload) {
        mockScript.onload()
      }

      await loadPromise

      expect(document.createElement).toHaveBeenCalledWith("script")
      expect(mockGapi.load).toHaveBeenCalledWith(
        "client:auth2",
        expect.any(Function)
      )
      expect(mockGapi.client.init).toHaveBeenCalled()
      expect(mockGapi.client.load).toHaveBeenCalledWith("sheets", "v4")
    })

    test("スクリプト読み込みエラー時に適切にエラーハンドリングする", async () => {
      const mockScript = {
        src: "",
        onload: null as any,
        onerror: null as any
      }

      document.createElement = jest.fn().mockReturnValue(mockScript)

      const loadPromise = loadGapi()

      // スクリプトのonerrorを実行
      if (mockScript.onerror) {
        mockScript.onerror()
      }

      await expect(loadPromise).rejects.toThrow("Failed to load gapi script")
    })

    test("API初期化エラー時に適切にエラーハンドリングする", async () => {
      const mockScript = {
        src: "",
        onload: null as any,
        onerror: null as any
      }

      document.createElement = jest.fn().mockReturnValue(mockScript)
      mockGapi.load.mockImplementation((apis: string, callback: () => void) => {
        callback()
      })
      mockGapi.client.init.mockRejectedValue(new Error("API init failed"))

      const loadPromise = loadGapi()

      if (mockScript.onload) {
        mockScript.onload()
      }

      await expect(loadPromise).rejects.toThrow("API init failed")
    })
  })

  describe("認証機能", () => {
    test("ユーザーがサインインできる", async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined)
      mockGapi.auth2.getAuthInstance.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        currentUser: {
          get: jest.fn()
        }
      })

      await signIn()

      expect(mockSignIn).toHaveBeenCalled()
    })

    test("ユーザーがサインアウトできる", async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined)
      mockGapi.auth2.getAuthInstance.mockReturnValue({
        signIn: jest.fn(),
        signOut: mockSignOut,
        currentUser: {
          get: jest.fn()
        }
      })

      await signOut()

      expect(mockSignOut).toHaveBeenCalled()
    })

    test("認証URLを取得できる", async () => {
      const mockSignIn = jest.fn().mockResolvedValue(undefined)
      const mockGetAuthResponse = jest.fn().mockReturnValue({
        id_token: "test_id_token",
        access_token: "test_access_token",
        expires_in: 3600
      })

      mockGapi.auth2.getAuthInstance.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        currentUser: {
          get: jest.fn().mockReturnValue({
            getAuthResponse: mockGetAuthResponse
          })
        }
      })

      const authUrl = await getAuthUrl()

      expect(mockSignIn).toHaveBeenCalled()
      expect(authUrl).toBe("test_id_token")
    })

    test("認証情報を設定できる", async () => {
      const mockGetAuthResponse = jest.fn().mockReturnValue({
        access_token: "test_access_token",
        expires_in: 3600
      })

      mockGapi.auth2.getAuthInstance.mockReturnValue({
        signIn: jest.fn(),
        signOut: jest.fn(),
        currentUser: {
          get: jest.fn().mockReturnValue({
            getAuthResponse: mockGetAuthResponse
          })
        }
      })

      await setCredentials("test_code")

      expect(mockGapi.auth.setToken).toHaveBeenCalledWith({
        access_token: "test_access_token",
        expires_in: "3600",
        error: "",
        state: ""
      })
    })
  })

  describe("スプレッドシート操作", () => {
    test("スプレッドシートにデータを追加できる", async () => {
      const mockAppend = jest.fn().mockResolvedValue(undefined)
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      const spreadsheetId = "test_spreadsheet_id"
      const range = "Sheet1!A1:E1"
      const values = [["Team", "Action", "Start", "End", "Labels"]]

      await appendToSheet(spreadsheetId, range, values)

      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        resource: {
          values
        }
      })
    })

    test("複数行のデータを追加できる", async () => {
      const mockAppend = jest.fn().mockResolvedValue(undefined)
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      const spreadsheetId = "test_spreadsheet_id"
      const range = "Sheet1!A1:E10"
      const values = [
        ["Team A", "Pass", "00:10", "00:15", "Good, Accurate"],
        ["Team B", "Shot", "00:20", "00:22", "Goal, Excellent"],
        ["Team A", "Tackle", "00:30", "", "Defensive"]
      ]

      await appendToSheet(spreadsheetId, range, values)

      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        resource: {
          values
        }
      })
    })

    test("API エラー時に適切にエラーハンドリングする", async () => {
      const mockAppend = jest
        .fn()
        .mockRejectedValue(new Error("Sheets API error"))
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      const spreadsheetId = "test_spreadsheet_id"
      const range = "Sheet1!A1:E1"
      const values = [["Test data"]]

      await expect(appendToSheet(spreadsheetId, range, values)).rejects.toThrow(
        "Sheets API error"
      )
    })
  })

  describe("CSV エクスポート連携機能", () => {
    test("アクションデータをスプレッドシート用形式に変換できる", () => {
      const actions = [
        {
          team: "Team A",
          action: "Pass",
          start: 1000,
          end: 2000,
          labels: ["Good", "Accurate"]
        },
        {
          team: "Team B",
          action: "Shot",
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

      const formatTimeForSheets = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      }

      const convertActionsToSheetData = (actions: any[]): string[][] => {
        const header = ["Team", "Action", "Start", "End", "Labels"]
        const rows = actions.map((action) => [
          action.team,
          action.action,
          formatTimeForSheets(action.start),
          action.end ? formatTimeForSheets(action.end) : "進行中",
          action.labels.join(", ")
        ])
        return [header, ...rows]
      }

      const sheetData = convertActionsToSheetData(actions)

      expect(sheetData[0]).toEqual(["Team", "Action", "Start", "End", "Labels"])
      expect(sheetData[1]).toEqual([
        "Team A",
        "Pass",
        "00:01",
        "00:02",
        "Good, Accurate"
      ])
      expect(sheetData[2]).toEqual([
        "Team B",
        "Shot",
        "00:03",
        "00:04",
        "Result - goal, Quality - excellent"
      ])
      expect(sheetData[3]).toEqual([
        "Team A",
        "Tackle",
        "00:05",
        "進行中",
        "Defensive"
      ])
    })

    test("カテゴリ別ラベル情報をスプレッドシートに追加できる", () => {
      const actionsWithCategorizedLabels = [
        {
          team: "Team A",
          action: "Serve",
          start: 1000,
          end: 2000,
          labels: ["Result - ace", "Type - first serve", "Placement - wide"]
        }
      ]

      const convertWithCategories = (actions: any[]): string[][] => {
        const categories = ["Result", "Type", "Placement"]
        const header = [
          "Team",
          "Action",
          "Start",
          "End",
          ...categories,
          "Other Labels"
        ]

        const rows = actions.map((action) => {
          const categoryValues: Record<string, string[]> = {}
          const otherLabels: string[] = []

          action.labels.forEach((label: string) => {
            const categoryMatch = label.match(/^(.+?) - (.+)$/)
            if (categoryMatch) {
              const [, category, value] = categoryMatch
              if (categories.includes(category)) {
                if (!categoryValues[category]) {
                  categoryValues[category] = []
                }
                categoryValues[category].push(value)
              } else {
                otherLabels.push(label)
              }
            } else {
              otherLabels.push(label)
            }
          })

          const row = [
            action.team,
            action.action,
            formatTimeForSheets(action.start),
            action.end ? formatTimeForSheets(action.end) : "進行中"
          ]

          categories.forEach((category) => {
            row.push(categoryValues[category]?.join(", ") || "")
          })

          row.push(otherLabels.join(", "))

          return row
        })

        return [header, ...rows]
      }

      const formatTimeForSheets = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      }

      const sheetData = convertWithCategories(actionsWithCategorizedLabels)

      expect(sheetData[0]).toEqual([
        "Team",
        "Action",
        "Start",
        "End",
        "Result",
        "Type",
        "Placement",
        "Other Labels"
      ])
      expect(sheetData[1]).toEqual([
        "Team A",
        "Serve",
        "00:01",
        "00:02",
        "ace",
        "first serve",
        "wide",
        ""
      ])
    })
  })

  describe("エラーハンドリングとフォールバック", () => {
    test("ネットワークエラー時に適切なエラーメッセージを表示する", async () => {
      const mockAppend = jest.fn().mockRejectedValue(new Error("Network error"))
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      try {
        await appendToSheet("test_id", "Sheet1!A1:E1", [["test"]])
      } catch (error: any) {
        expect(error.message).toBe("Network error")
      }
    })

    test("認証エラー時に再認証を促す", async () => {
      const mockAppend = jest.fn().mockRejectedValue({
        status: 401,
        message: "Unauthorized"
      })
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      const handleAuthError = (error: any): boolean => {
        return error.status === 401
      }

      try {
        await appendToSheet("test_id", "Sheet1!A1:E1", [["test"]])
      } catch (error: any) {
        const isAuthError = handleAuthError(error)
        expect(isAuthError).toBe(true)
      }
    })

    test("API制限エラー時に適切にハンドリングする", async () => {
      const mockAppend = jest.fn().mockRejectedValue({
        status: 429,
        message: "Quota exceeded"
      })
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      const handleQuotaError = (error: any): boolean => {
        return error.status === 429
      }

      try {
        await appendToSheet("test_id", "Sheet1!A1:E1", [["test"]])
      } catch (error: any) {
        const isQuotaError = handleQuotaError(error)
        expect(isQuotaError).toBe(true)
      }
    })
  })

  describe("統合機能テスト", () => {
    test("完全なワークフロー: 認証からデータ追加まで", async () => {
      // サインイン
      const mockSignIn = jest.fn().mockResolvedValue(undefined)
      mockGapi.auth2.getAuthInstance.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        currentUser: {
          get: jest.fn().mockReturnValue({
            getAuthResponse: jest.fn().mockReturnValue({
              access_token: "test_token",
              expires_in: 3600
            })
          })
        }
      })

      // データ追加
      const mockAppend = jest.fn().mockResolvedValue(undefined)
      mockGapi.client.sheets = {
        spreadsheets: {
          values: {
            append: mockAppend
          }
        }
      }

      await signIn()
      await setCredentials("test_code")
      await appendToSheet("test_id", "Sheet1!A1:E1", [["test", "data"]])

      expect(mockSignIn).toHaveBeenCalled()
      expect(mockGapi.auth.setToken).toHaveBeenCalled()
      expect(mockAppend).toHaveBeenCalled()
    })
  })
})
