/**
 * アプリケーション全体で使用される定数
 */

/**
 * パネルの位置設定
 */
export const PANEL_POSITION = {
  TOP: 10,
  RIGHT: 10,
  Z_INDEX: 1000,
  NOTIFICATION_Z_INDEX: 1001
} as const

/**
 * パネルのサイズ設定
 */
export const PANEL_SIZE = {
  MIN_WIDTH: 450,
  MIN_HEIGHT: 300,
  DEFAULT_WIDTH: 500,
  DEFAULT_HEIGHT: 400
} as const

/**
 * 通知の設定
 */
export const NOTIFICATION = {
  DISPLAY_DURATION: 3000, // 3秒
  ANIMATION_DURATION: 300 // 0.3秒
} as const

/**
 * スタイルの定数
 */
export const STYLES = {
  BORDER_RADIUS: {
    SMALL: "4px",
    MEDIUM: "6px",
    LARGE: "8px"
  },
  PADDING: {
    SMALL: "6px 12px",
    MEDIUM: "12px 16px",
    LARGE: "16px 24px"
  },
  FONT_SIZE: {
    SMALL: "12px",
    MEDIUM: "14px",
    LARGE: "16px",
    HEADING: "20px"
  },
  COLORS: {
    PRIMARY: "#3b82f6",
    PRIMARY_HOVER: "#2563eb",
    SUCCESS: "#22c55e",
    SUCCESS_HOVER: "#16a34a",
    ERROR: "#ef4444",
    ERROR_HOVER: "#dc2626",
    WARNING: "#f59e0b",
    WARNING_HOVER: "#d97706",
    GRAY: "#6b7280",
    GRAY_HOVER: "#4b5563",
    WHITE: "#ffffff",
    BLACK: "#000000",
    TEXT_PRIMARY: "#1a1a1a",
    TEXT_SECONDARY: "#6b7280",
    BACKGROUND: "#fafafa",
    BORDER: "#d1d5db"
  }
} as const

/**
 * Chrome 拡張機能の設定
 */
export const CHROME_EXTENSION = {
  STORAGE_KEYS: {
    TEAMS: "teams",
    SHOW_EXTENSION: "showExtension",
    BUTTON_SETS: "buttonSets",
    SELECTED_BUTTON_SET: "selectedButtonSet",
    SELECTED_ACTION: "selectedAction",
    ACTIONS: "actions",
    SPREADSHEET_ID: "spreadsheetId"
  },
  MESSAGE_TYPES: {
    EXTENSION_VISIBILITY_UPDATED: "EXTENSION_VISIBILITY_UPDATED",
    SEEK_VIDEO: "seekVideo",
    ACTION_TOGGLE: "actionToggle"
  }
} as const

/**
 * テーブルの設定
 */
export const TABLE = {
  ITEMS_PER_PAGE: 10,
  MAX_ITEMS_PER_PAGE: 100
} as const

/**
 * バリデーションの設定
 */
export const VALIDATION = {
  MIN_ACTION_NAME_LENGTH: 1,
  MAX_ACTION_NAME_LENGTH: 50,
  MIN_LABEL_NAME_LENGTH: 1,
  MAX_LABEL_NAME_LENGTH: 50,
  MIN_TEAM_NAME_LENGTH: 1,
  MAX_TEAM_NAME_LENGTH: 30,
  MIN_CATEGORY_NAME_LENGTH: 1,
  MAX_CATEGORY_NAME_LENGTH: 30
} as const
