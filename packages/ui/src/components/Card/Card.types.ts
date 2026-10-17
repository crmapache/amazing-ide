import type { ReactNode } from 'react'

export type CardProps = {
  /** Заголовок карточки. Нет - карточка без шапки, просто стеклянный лист. */
  title?: string | undefined
  /** Мелкая строка под заголовком. */
  description?: string | undefined
  /** Справа в шапке: кнопка, метка. */
  actions?: ReactNode | undefined
  children: ReactNode
}
