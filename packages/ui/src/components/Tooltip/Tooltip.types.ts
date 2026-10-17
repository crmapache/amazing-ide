import type { ReactNode } from 'react'

/** С какой стороны элемента встаёт подсказка. Не помещается - перевернётся сама. */
export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end'

export type TooltipProps = {
  label: string
  placement?: TooltipPlacement | undefined
  /**
   * Обёртка растягивается на всё место в родителе-flex, а не по размеру содержимого:
   * для элемента, который сам занимает всю ячейку (подпись вкладки).
   */
  stretch?: boolean | undefined
  /** Элемент, к которому подсказка: кнопка, вкладка. */
  children: ReactNode
}
