import React from "react"

import { LabelButton } from "~components/LabelButton"

interface LabelsSectionProps {
  labels: Record<string, string[]> // カテゴリ名をキー、ラベル配列を値とする形式
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
}

/**
 * ラベルセクションコンポーネント
 */
export const LabelsSection: React.FC<LabelsSectionProps> = ({
  labels,
  activeLabels,
  onLabelClick
}) => {
  // Record<string, string[]>形式のラベルをサポート
  // アクションが選択されていない場合、または有効なラベルがない場合はラベルを表示しない
  if (
    !labels ||
    typeof labels !== "object" ||
    Object.keys(labels).length === 0 ||
    !Object.values(labels).some(
      (labelArray) => Array.isArray(labelArray) && labelArray.length > 0
    )
  ) {
    return null
  }

  return (
    <div className="mt-6">
      <div className="space-y-4">
        {Object.entries(labels).map(([category, labelList]) => {
          // 配列でない場合はスキップ
          if (!Array.isArray(labelList) || labelList.length === 0) {
            return null
          }

          return (
            <div
              key={category}
              className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border-2 border-gray-200 shadow-lg p-4 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              {/* カテゴリヘッダー */}
              <h4 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl shadow-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {category}
                </span>
              </h4>
              {/* ラベルボタンのグリッド */}
              <div
                className="grid gap-3 auto-fit-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
                }}
                role="group"
                aria-label={`${category}カテゴリのラベル`}>
                {labelList.map((label) => {
                  // 完全なラベル名（内部処理用）
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
