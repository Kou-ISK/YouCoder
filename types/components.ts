import type { Button, ButtonSet, ModalType } from "./common"

/**
 * Modal コンポーネントの Props
 */
export interface ModalProps {
  isOpen: boolean
  inputValue: string
  modalType: ModalType
  onInputChange: (value: string) => void
  onClose: () => void
  onSubmit: (category?: string) => void
}

/**
 * ButtonSetComponent の Props
 */
export interface ButtonSetComponentProps {
  buttonSet: ButtonSet | undefined
  selectedAction: string | null
  onUpdateButtonSet: (updatedSet: ButtonSet) => void
  onActionSelect: (action: string | null) => void
}

/**
 * ActionButton の Props
 */
export interface ActionButtonProps {
  action: string
  onClick: (team: string, action: string) => void
  team: string
  isActive: boolean
  colorClass?: string
}

/**
 * LabelButton の Props
 */
export interface LabelButtonProps {
  label: string
  isActive: boolean
  isDisabled: boolean
  onClick: (label: string) => void
}

/**
 * ActionList の Props
 */
export interface ActionListProps {
  actions: Record<string, string>
  onAdd: () => void
  onRemove: (action: string) => void
}

/**
 * LabelList の Props
 */
export interface LabelListProps {
  labels: Record<string, string>
  onAdd: () => void
  onRemove: (label: string) => void
}

/**
 * TeamList の Props
 */
export interface TeamListProps {
  teams: string[]
  onAdd: () => void
  onRemove: (team: string) => void
}

/**
 * TaggingPanel の Props
 */
export interface TaggingPanelProps {
  teams: string[]
  actions: Record<string, string>
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
}

/**
 * ActionsSection の Props
 */
export interface ActionsSectionProps {
  teams: string[]
  actions: Record<string, string>
  activeActions: Set<string>
  onActionToggle: (team: string, action: string) => void
}
