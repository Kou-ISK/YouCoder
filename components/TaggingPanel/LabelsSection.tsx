import React from "react"

import { LabelButton } from "~components/LabelButton"

interface LabelsSectionProps {
  labels: Record<string, string[]> // カテゴリ名をキー、ラベル配列を値とする形式のみサポート
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
}

/**
 * ラベルセクションコンポーネント - カテゴリベースの表示のみサポート
 */
export const LabelsSection: React.FC<LabelsSectionProps> = ({
  labels,
  activeLabels,
  onLabelClick
}) => {
  // Record<string, string[]>形式のラベルのみをサポート
  // アクションが選択されていない場合、または有効なラベルがない場合はラベルを表示しない
  if (
    !labels ||
    typeof labels !== "object" ||
    Array.isArray(labels) ||
    Object.keys(labels).length === 0 ||
    !Object.values(labels).some(
      (labelArray) => Array.isArray(labelArray) && labelArray.length > 0
    )
  ) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="space-y-3">
        {Object.entries(labels).map(([category, labelList]) => {
          // 配列でない場合はスキップ
          if (!Array.isArray(labelList) || labelList.length === 0) {
            return null
          }

          return (
            <div
              key={category}
              className="bg-white rounded-lg border-2 border-gray-200 shadow-sm p-3 hover:border-gray-300 transition-colors duration-200">
              {/* カテゴリヘッダー */}
              <h4 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 bg-gray-50 -mx-3 -mt-3 px-3 pt-3 rounded-t-lg">
                {category}
              </h4>
              {/* ラベルボタンのグリッド */}
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={`${category}カテゴリのラベル`}>
                {labelList.map((label) => {
                  // カテゴリ付きの完全なラベル名（内部処理用）
                  const fullLabelName = `${category} - ${label}`

                  return (
                    <LabelButton
                      key={fullLabelName}
                      label={label} // ボタンには短いラベル名を表示
                      isActive={activeLabels.has(fullLabelName)}
                      isDisabled={false}
                      onClick={() => onLabelClick(fullLabelName)} // 完全なラベル名で処理
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
