import type { ReactNode } from 'react'

export type SpecimenProps = {
  label: string
  /** Растянуть на всю ширину раздела: шкалы и широкие компоненты. */
  wide?: boolean | undefined
  /** Ряд с переносом (кнопки, метки) или колонка (поля, карточки). */
  layout?: 'row' | 'column' | undefined
  children: ReactNode
}
