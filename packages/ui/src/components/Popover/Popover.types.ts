import type { Ref, ReactNode, ToggleEventHandler } from 'react'

export type PopoverWidth = 'md' | 'lg' | 'xl'

/**
 * Где встаёт панель: под кнопкой, которая её открыла (меню проекта, ветки), или сверху
 * по центру окна - у панели, которую открывают и сочетанием клавиш (поиск везде).
 */
export type PopoverPlacement = 'anchor' | 'top'

export type PopoverProps = {
  id: string
  ref: Ref<HTMLDivElement>
  onToggle: ToggleEventHandler<HTMLDivElement>
  width?: PopoverWidth
  placement?: PopoverPlacement
  children: ReactNode
}
