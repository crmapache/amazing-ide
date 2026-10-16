import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

export type IconButtonSize = 'sm' | 'md'

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-label'
> & {
  icon: LucideIcon
  /** Подпись для подсказки и скринридера: у кнопки без текста других имён нет. */
  label: string
  size?: IconButtonSize
  /**
   * Состояние переключателя: активный вид в боковой полосе и подобное. Не задано -
   * обычная кнопка, без aria-pressed.
   */
  active?: boolean
}
