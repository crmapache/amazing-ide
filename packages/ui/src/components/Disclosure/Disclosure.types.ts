import type { ReactNode, ButtonHTMLAttributes } from 'react'

/** sm - строка в списке (вызов в ленте); md - шапка карточки, которая раскрывается. */
export type DisclosureSize = 'sm' | 'md'

export type DisclosureProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-expanded'
> & {
  expanded: boolean
  size?: DisclosureSize
  /** Содержимое строки после стрелки: иконка, подпись, состояние справа. */
  children: ReactNode
}
