import type { Notification } from "../types/common"

/**
 * エラーメッセージの取得
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "予期しないエラーが発生しました"
}

/**
 * ユーザーフレンドリーなエラーメッセージの生成
 */
export const generateUserFriendlyError = (
  operation: string,
  error: unknown
): string => {
  const baseMessage = getErrorMessage(error)

  // 一般的なエラーパターンのマッピング
  const errorPatterns = {
    NetworkError:
      "ネットワークに接続できません。インターネット接続を確認してください。",
    TypeError: "データの形式が正しくありません。",
    ReferenceError: "必要なデータが見つかりません。",
    JSON: "データの解析に失敗しました。ファイル形式を確認してください。",
    storage: "データの保存に失敗しました。ストレージの容量を確認してください。",
    permission: "必要な権限がありません。拡張機能の設定を確認してください。"
  }

  // パターンマッチング
  for (const [pattern, message] of Object.entries(errorPatterns)) {
    if (baseMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return `${operation}に失敗しました: ${message}`
    }
  }

  return `${operation}に失敗しました: ${baseMessage}`
}

/**
 * 通知の表示
 */
export const showNotification = (
  message: string,
  type: Notification["type"] = "info",
  setNotification: (notification: Notification | null) => void,
  duration: number = 3000
): void => {
  setNotification({ message, type })
  setTimeout(() => setNotification(null), duration)
}

/**
 * ログの記録
 */
export const logger = {
  error: (message: string, error?: unknown) => {
    console.error(`[YouCoder Error] ${message}`, error)
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[YouCoder Warning] ${message}`, data)
  },
  info: (message: string, data?: unknown) => {
    console.info(`[YouCoder Info] ${message}`, data)
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[YouCoder Debug] ${message}`, data)
    }
  }
}

/**
 * Chrome拡張機能の権限チェック
 */
export const checkChromePermissions = (): boolean => {
  try {
    return !!(chrome && chrome.storage && chrome.storage.local)
  } catch (error) {
    logger.error("Chrome拡張機能の権限チェックに失敗", error)
    return false
  }
}

/**
 * 非同期処理のエラーハンドリング用ラッパー
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  onError?: (error: unknown) => void
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    const errorMessage = generateUserFriendlyError(operationName, error)
    logger.error(errorMessage, error)

    if (onError) {
      onError(error)
    }

    return null
  }
}
