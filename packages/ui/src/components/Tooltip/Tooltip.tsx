import clsx from 'clsx'

import { useTooltip } from './Tooltip.hooks'
import styles from './Tooltip.module.scss'
import type { TooltipProps } from './Tooltip.types'

/**
 * Подсказка над элементом вместо системного title: стеклянная, в стиле окна, и
 * появляется с задержкой при наведении или фокусе с клавиатуры. Держится на
 * popover="hint" и CSS anchor positioning. Для скринридера не дублируется: у
 * элемента внутри должно быть своё имя (aria-label или текст).
 */
export const Tooltip = ({
  label,
  placement = 'bottom',
  stretch = false,
  disabled = false,
  children,
}: TooltipProps) => {
  const { anchorRef, tooltipRef, handlers } = useTooltip(disabled)

  return (
    <span ref={anchorRef} className={clsx(styles.anchor, stretch && styles.stretch)} {...handlers}>
      {children}
      <span
        ref={tooltipRef}
        popover="hint"
        aria-hidden
        className={clsx(styles.tooltip, styles[placement])}>
        {label}
      </span>
    </span>
  )
}
