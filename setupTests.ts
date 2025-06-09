import "@testing-library/jest-dom"

// Chrome API のモック
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
}

// グローバルなchromeオブジェクトをモック
Object.defineProperty(globalThis, "chrome", {
  value: mockChrome,
  writable: true
})

// window.chrome も設定
Object.defineProperty(window, "chrome", {
  value: mockChrome,
  writable: true
})

// sessionStorageのモック
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true
})

// HTMLVideoElementのモック
Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
  get: jest.fn(() => 10),
  set: jest.fn(),
  configurable: true
})

// Document.querySelector のモック設定
const mockVideo = {
  currentTime: 10,
  duration: 100
}

document.querySelector = jest.fn((selector) => {
  if (selector === "video") {
    return mockVideo as any
  }
  return null
})

// YouTube URL のモック - Jest環境で安全な方法
const mockLocation = {
  href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  search: "?v=dQw4w9WgXcQ",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  pathname: "/watch",
  origin: "https://www.youtube.com",
  protocol: "https:",
  host: "www.youtube.com",
  hostname: "www.youtube.com",
  port: "",
  hash: ""
}

// Jest環境用のlocationモック
;(globalThis as any).mockLocation = mockLocation

// scrollIntoViewのモック（TimelineTableテスト用）
Element.prototype.scrollIntoView = jest.fn()

// URL.createObjectURLのモック（CSV出力テスト用）
global.URL.createObjectURL = jest.fn(() => "mock-object-url")
global.URL.revokeObjectURL = jest.fn()

// Object.assign を使ってwindow.locationの一部プロパティのみを上書き
if (typeof window !== "undefined" && window.location) {
  Object.assign(window.location, {
    href: mockLocation.href,
    search: mockLocation.search,
    pathname: mockLocation.pathname
  })
}

// window.youCoderCache のモック
Object.defineProperty(window, "youCoderCache", {
  value: {},
  writable: true
})
