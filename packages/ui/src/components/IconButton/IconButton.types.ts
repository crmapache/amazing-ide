import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

import type { TooltipPlacement } from '../Tooltip/Tooltip.types'

export type IconButtonSize = 'sm' | 'md'

/** ghost - тихая кнопка в полосе или строке; primary - главное действие (отправить). */
export type IconButtonVariant = 'ghost' | 'primary'

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'aria-label'
> & {
  icon: LucideIcon
  /** Подпись для подсказки и скринридера: у кнопки без текста других имён нет. */
  label: string
  size?: IconButtonSize
  variant?: IconButtonVariant
  /**
   * Состояние переключателя: активный вид в боковой полосе и подобное. Не задано -
   * обычная кнопка, без aria-pressed.
   */
  active?: boolean
  /** Где встаёт подсказка. В боковых полосах - сбоку, чтобы не закрыть соседние кнопки. */
  tooltipPlacement?: TooltipPlacement | undefined
}
