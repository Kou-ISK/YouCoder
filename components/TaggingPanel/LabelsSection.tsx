import React from "react"

import { LabelButton } from "~components/LabelButton"

interface LabelsSectionProps {
  labels: Record<string, string[]> | string[]
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
}

/**
 * ラベルセクションコンポーネント
 * カテゴリ別にラベルボタンを表示する
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
    <section
      className="mb-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-green-200 shadow-lg"
      role="region"
      aria-labelledby="labels-section-title">
      <div className="mb-4">
        <h3
          id="labels-section-title"
          className="text-sm font-bold text-green-800 mb-2 flex items-center">
          <span className="mr-2 text-lg">🏷️</span>
          ラベル選択
        </h3>
        <div className="h-px bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300"></div>
      </div>

      <div className="space-y-3">
        {Object.entries(normalizedLabels).map(([category, labelList]) => {
          const safeLabelList = Array.isArray(labelList) ? labelList : []

          if (safeLabelList.length === 0) {
            return null
          }

          return (
            <CategoryGroup
              key={category}
              category={category}
              labels={safeLabelList}
              activeLabels={activeLabels}
              onLabelClick={onLabelClick}
            />
          )
        })}
      </div>
    </section>
  )
}

interface CategoryGroupProps {
  category: string
  labels: string[]
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
}

/**
 * カテゴリグループコンポーネント
 * 単一カテゴリのラベルボタンを表示する
 */
const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  labels,
  activeLabels,
  onLabelClick
}) => {
  const isGeneralCategory = category === "一般"

  return (
    <div className="bg-white rounded-xl p-3 shadow-md border-2 border-gray-200 hover:border-green-300 transition-all duration-200">
      {!isGeneralCategory && <CategoryHeader category={category} />}

      <LabelButtonGrid
        category={category}
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={onLabelClick}
        isIndented={false}
      />
    </div>
  )
}

interface CategoryHeaderProps {
  category: string
}

/**
 * カテゴリヘッダーコンポーネント
 */
const CategoryHeader: React.FC<CategoryHeaderProps> = ({ category }) => (
  <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200 flex items-center">
    <span className="mr-1">📂</span>
    {category}
  </h4>
)

interface LabelButtonGridProps {
  category: string
  labels: string[]
  activeLabels: Set<string>
  onLabelClick: (label: string) => void
  isIndented: boolean
}

/**
 * ラベルボタングリッドコンポーネント
 */
const LabelButtonGrid: React.FC<LabelButtonGridProps> = ({
  category,
  labels,
  activeLabels,
  onLabelClick,
  isIndented
}) => {
  const isGeneralCategory = category === "一般"

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label={
        isGeneralCategory ? "一般ラベル" : `${category}カテゴリのラベル`
      }>
      {labels.map((label) => {
        const displayLabel = isGeneralCategory
          ? label
          : `${category} - ${label}`

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
  )
}
