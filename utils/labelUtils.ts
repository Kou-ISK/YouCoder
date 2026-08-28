import type { LabelDisplay } from "../types/common"

/**
 * ラベル処理のユーティリティ関数
 */

/**
 * ラベルの配列を生成（表示用）
 */
export const getLabelList = (
  labels: Record<string, string[]>
): LabelDisplay[] => {
  const result: LabelDisplay[] = []

  for (const [category, labelList] of Object.entries(labels)) {
    for (const label of labelList) {
      result.push({
        category,
        label,
        displayLabel: `${category} - ${label}`
      })
    }
  }

  return result
}

/**
 * ラベル文字列からカテゴリとラベルを分解
 */
export const parseLabel = (
  displayLabel: string
): { category: string; label: string } | null => {
  const parts = displayLabel.split(" - ")
  if (parts.length >= 2) {
    const category = parts[0]
    const label = parts.slice(1).join(" - ") // "xxx - yyy - zzz"のような場合に対応
    return { category, label }
  }
  // カテゴリがない場合はnullを返す
  return null
}

/**
 * カテゴリ付きラベルの作成
 */
export const createCategorizedLabel = (
  category: string,
  label: string
): string => {
  return `${category} - ${label}`
}

/**
 * カテゴリ付きラベルの検証
 */
export const validateCategorizedLabels = (
  labels: Record<string, string[]>
): boolean => {
  // 空のオブジェクトは有効
  if (Object.keys(labels).length === 0) {
    return true
  }

  // 各カテゴリとラベルの検証
  for (const [category, labelList] of Object.entries(labels)) {
    // カテゴリ名の検証
    if (typeof category !== "string" || category.trim() === "") {
      return false
    }

    // ラベルリストの検証
    if (!Array.isArray(labelList)) {
      return false
    }

    // 各ラベルの検証
    for (const label of labelList) {
      if (typeof label !== "string" || label.trim() === "") {
        return false
      }
    }
  }

  return true
}

/**
 * カテゴリ付きラベルの正規化
 */
export const normalizeCategorizedLabels = (
  labels: Record<string, string[]>
): Record<string, string[]> => {
  const normalized: Record<string, string[]> = {}

  for (const [category, labelList] of Object.entries(labels)) {
    const trimmedCategory = category.trim()
    if (trimmedCategory && Array.isArray(labelList)) {
      const trimmedLabels = labelList
        .filter((label) => typeof label === "string" && label.trim() !== "")
        .map((label) => label.trim())

      if (trimmedLabels.length > 0) {
        normalized[trimmedCategory] = trimmedLabels
      }
    }
  }

  return normalized
}

/**
 * ラベルの重複チェック
 */
export const checkLabelDuplication = (
  labels: Record<string, string[]>,
  category: string,
  label: string
): boolean => {
  if (!labels[category]) {
    return false
  }
  return labels[category].includes(label)
}

/**
 * カテゴリにラベルを追加
 */
export const addLabelToCategory = (
  labels: Record<string, string[]>,
  category: string,
  label: string
): Record<string, string[]> => {
  const newLabels = { ...labels }

  if (!newLabels[category]) {
    newLabels[category] = []
  }

  if (!newLabels[category].includes(label)) {
    newLabels[category] = [...newLabels[category], label]
  }

  return newLabels
}

/**
 * カテゴリからラベルを削除
 */
export const removeLabelFromCategory = (
  labels: Record<string, string[]>,
  category: string,
  label: string
): Record<string, string[]> => {
  const newLabels = { ...labels }

  if (newLabels[category]) {
    newLabels[category] = newLabels[category].filter((l) => l !== label)

    // カテゴリが空になった場合は削除
    if (newLabels[category].length === 0) {
      delete newLabels[category]
    }
  }

  return newLabels
}

/**
 * ラベルを複数のボタンから取得
 */
export const getLabelsFromButtons = (
  buttons: Array<{ labels: Record<string, string[]> }>
): Record<string, string[]> => {
  const allLabels: Record<string, string[]> = {}

  for (const button of buttons) {
    for (const [category, labelList] of Object.entries(button.labels)) {
      if (!allLabels[category]) {
        allLabels[category] = []
      }

      for (const label of labelList) {
        if (!allLabels[category].includes(label)) {
          allLabels[category].push(label)
        }
      }
    }
  }

  return allLabels
}
