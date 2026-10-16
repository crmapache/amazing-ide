import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type MenuItemProps = {
  label: string
  /** Вторая строка мельче: путь проекта и подобное. */
  description?: string | undefined
  /** Иконка слева. Для значка или своей картинки - leading. */
  icon?: LucideIcon | undefined
  leading?: ReactNode | undefined
  /** Текущий выбор: текущий проект, текущая ветка. Подсвечен постоянно. */
  current?: boolean | undefined
  disabled?: boolean | undefined
  /** Подсказка справа серым: «not built yet», сочетание клавиш. */
  hint?: string | undefined
  onSelect: () => void
}
