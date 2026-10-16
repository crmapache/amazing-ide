import type { IconButtonSize } from './IconButton.types'

// Размер глифа в пикселях: lucide принимает число, а не CSS-переменную.
// Совпадает с --size-icon-sm / --size-icon-md из tokens.css.
export const ICON_SIZE: Record<IconButtonSize, number> = {
  sm: 14,
  md: 16,
}

export const ICON_STROKE_WIDTH = 1.75
