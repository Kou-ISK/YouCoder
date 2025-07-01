import React from "react"

import { LabelButton } from "~components/LabelButton"

interface LabelsSectionProps {
  labels: Record<string, string[]> | string[]
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
}

/**
 * ラベルセクションコンポーネント - シンプルな表示
 */
export const LabelsSection: React.FC<LabelsSectionProps> = ({
  labels,
  activeLabels,
  onLabelClick
}) => {
  // ラベルを安全にカテゴリ付きに正規化
  const normalizedLabels = React.useMemo(() => {
    if (Array.isArray(labels)) {
      return labels.length === 0 ? {} : { 一般: labels }
    }
    return typeof labels === "object" && labels !== null ? labels : { 一般: [] }
  }, [labels])

  if (Object.keys(normalizedLabels).length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="space-y-4">
          {Object.entries(normalizedLabels).map(([category, labelList]) => {
            const safeLabelList = Array.isArray(labelList) ? labelList : []

            if (safeLabelList.length === 0) {
              return null
            }

            return (
              <div key={category}>
                {category !== "一般" && (
                  <h4 className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-200">
                    {category}
                  </h4>
                )}
                <div className="flex flex-wrap gap-2">
                  {safeLabelList.map((label) => {
                    const displayLabel =
                      category === "一般" ? label : `${category} - ${label}`

                    return (
                      <LabelButton
                        key={displayLabel}
                        label={label}
                        isActive={activeLabels.has(displayLabel)}
                        isDisabled={false}
                        onClick={() => onLabelClick(displayLabel)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
