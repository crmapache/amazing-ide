import type { ButtonSize } from './Button.types'

// Размер глифа в пикселях: lucide принимает число, а не CSS-переменную.
// Совпадает с --size-icon-xs / --size-icon-sm из tokens.css.
export const BUTTON_ICON_SIZE: Record<ButtonSize, number> = {
  sm: 12,
  md: 14,
}

export const BUTTON_ICON_STROKE_WIDTH = 1.75
