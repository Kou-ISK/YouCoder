/**
 * 共通で使用される型定義
 */

/**
 * ボタンの型定義
 */
export interface Button {
  action: string
  labels: Record<string, string[]> // カテゴリ付きラベルのみサポート
}

/**
 * ボタンセットの型定義
 */
export interface ButtonSet {
  setName: string
  buttons: Button[]
}

/**
 * アクションの型定義
 */
export interface Action {
  team: string
  action: string
  start: number
  end?: number
  labels: Record<string, string[]>
}

/**
 * 通知の型定義
 */
export interface Notification {
  message: string
  type: "success" | "error" | "info"
}

/**
 * モーダルの型定義
 */
export type ModalType =
  | "action"
  | "label"
  | "team"
  | "buttonSet"
  | "buttonInSet"
  | "addAction"
  | "addLabel"
  | null

/**
 * ラベル表示用の型定義
 */
export interface LabelDisplay {
  category: string
  label: string
  displayLabel: string
}

/**
 * Chrome storage データの型定義
 */
export interface ChromeStorageData {
  teams?: string[]
  showExtension?: boolean
  buttonSets?: ButtonSet[]
  selectedButtonSet?: string
  selectedAction?: string
  actions?: Action[]
}
