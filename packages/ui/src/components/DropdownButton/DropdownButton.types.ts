import type { ReactNode, ButtonHTMLAttributes } from 'react'

export type DropdownButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-label' | 'aria-haspopup'
> & {
  /** Что сейчас выбрано: имя проекта, ветки. */
  label: string
  /** Значок слева: Avatar или иконка. */
  leading?: ReactNode | undefined
  /** Подпись для скринридера: что переключает кнопка. */
  menuLabel: string
}
