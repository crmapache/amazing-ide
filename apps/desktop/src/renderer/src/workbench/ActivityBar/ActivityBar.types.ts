import type { ViewDescriptor } from '../views/views.types'

export type ActivityBarProps<ViewId extends string> = {
  views: readonly ViewDescriptor<ViewId>[]
  activeViewId: ViewId
  /** Открыта ли панель: при свёрнутой ни одна иконка не горит. */
  isPanelOpen: boolean
  /** С какой стороны окна стоит полоса: от этого зависит, где у неё граница. */
  edge: 'start' | 'end'
  label: string
  onSelect: (viewId: ViewId) => void
}
