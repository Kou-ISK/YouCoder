import { act, renderHook } from "@testing-library/react"

import { usePanelPosition } from "./usePanelPosition"

// localStorageのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// windowオブジェクトのモック
const windowMock = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// グローバル変数のモック
Object.defineProperty(window, "localStorage", {
  value: localStorageMock
})

Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: windowMock.innerWidth
})

Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: windowMock.innerHeight
})

Object.defineProperty(window, "addEventListener", {
  value: windowMock.addEventListener
})

Object.defineProperty(window, "removeEventListener", {
  value: windowMock.removeEventListener
})

describe("usePanelPosition", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  test("デフォルトの位置とサイズを返す", () => {
    const { result } = renderHook(() => usePanelPosition())

    expect(result.current.position).toEqual({
      x: Math.max(0, window.innerWidth - 300),
      y: 16
    })
    expect(result.current.size).toEqual({
      width: 240,
      height: Math.min(300, window.innerHeight - 100)
    })
  })

  test("カスタムのデフォルト位置とサイズを使用する", () => {
    const defaultPosition = { x: 100, y: 50 }
    const defaultSize = { width: 400, height: 500 }

    const { result } = renderHook(() =>
      usePanelPosition({ defaultPosition, defaultSize })
    )

    expect(result.current.position).toEqual(defaultPosition)
    expect(result.current.size).toEqual(defaultSize)
  })

  test("位置変更ハンドラーが正しく動作する", () => {
    const { result } = renderHook(() => usePanelPosition())

    const newPosition = { x: 200, y: 100 }

    act(() => {
      result.current.handlePositionChange(newPosition)
    })

    expect(result.current.position).toEqual(newPosition)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "taggingPanel_position",
      JSON.stringify(newPosition)
    )
  })

  test("サイズ変更ハンドラーが正しく動作する", () => {
    const { result } = renderHook(() => usePanelPosition())

    const newSize = { width: 400, height: 500 }

    act(() => {
      result.current.handleSizeChange(newSize)
    })

    expect(result.current.size).toEqual(newSize)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "taggingPanel_size",
      JSON.stringify(newSize)
    )
  })

  test("カスタムストレージキーを使用する", () => {
    const storageKey = "customPanel"
    const { result } = renderHook(() => usePanelPosition({ storageKey }))

    const newPosition = { x: 200, y: 100 }

    act(() => {
      result.current.handlePositionChange(newPosition)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "customPanel_position",
      JSON.stringify(newPosition)
    )
  })

  test("保存された位置を復元する", () => {
    const savedPosition = { x: 150, y: 75 }
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "taggingPanel_position") {
        return JSON.stringify(savedPosition)
      }
      return null
    })

    const { result } = renderHook(() => usePanelPosition())

    expect(result.current.position).toEqual(savedPosition)
  })

  test("保存されたサイズを復元する", () => {
    const savedSize = { width: 450, height: 550 }
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "taggingPanel_size") {
        return JSON.stringify(savedSize)
      }
      return null
    })

    const { result } = renderHook(() => usePanelPosition())

    expect(result.current.size).toEqual(savedSize)
  })

  test("無効な保存位置を無視する", () => {
    const invalidPosition = { x: -500, y: -100 } // 画面外
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "taggingPanel_position") {
        return JSON.stringify(invalidPosition)
      }
      return null
    })

    const { result } = renderHook(() => usePanelPosition())

    // デフォルト位置が使用される
    expect(result.current.position).toEqual({
      x: Math.max(0, window.innerWidth - 300),
      y: 16
    })
  })

  test("無効な保存サイズを無視する", () => {
    const invalidSize = { width: 100, height: 50 } // 最小サイズ未満
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "taggingPanel_size") {
        return JSON.stringify(invalidSize)
      }
      return null
    })

    const { result } = renderHook(() => usePanelPosition())

    // デフォルトサイズが使用される
    expect(result.current.size).toEqual({
      width: 240,
      height: Math.min(300, window.innerHeight - 100)
    })
  })

  test("JSON解析エラーを適切に処理する", () => {
    localStorageMock.getItem.mockReturnValue("invalid json")
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

    const { result } = renderHook(() => usePanelPosition())

    // デフォルト値が使用される
    expect(result.current.position).toEqual({
      x: Math.max(0, window.innerWidth - 300),
      y: 16
    })

    // 警告が出力される
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse saved position/size:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  test("localStorage保存エラーを適切に処理する", () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("Storage quota exceeded")
    })
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

    const { result } = renderHook(() => usePanelPosition())
    const newPosition = { x: 200, y: 100 }

    act(() => {
      result.current.handlePositionChange(newPosition)
    })

    // 位置は更新されるが、警告が出力される
    expect(result.current.position).toEqual(newPosition)
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to save position to localStorage:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })
})
