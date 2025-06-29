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
      className="border-t border-gray-200 pt-3"
      aria-labelledby="labels-section-title">
      <h3 id="labels-section-title" className="sr-only">
        ラベル選択
      </h3>

      <div className="space-y-2">
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
    <div className="mb-2 last:mb-0">
      {!isGeneralCategory && <CategoryHeader category={category} />}

      <LabelButtonGrid
        category={category}
        labels={labels}
        activeLabels={activeLabels}
        onLabelClick={onLabelClick}
        isIndented={!isGeneralCategory}
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
  <h4 className="text-xs font-semibold text-gray-500 mb-1 pl-1">{category}</h4>
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
      className={`flex flex-wrap gap-1 ${isIndented ? "ml-2" : ""}`}
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
