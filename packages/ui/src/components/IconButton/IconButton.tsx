import clsx from 'clsx'

import { Tooltip } from '../Tooltip/Tooltip'
import { ICON_SIZE, ICON_STROKE_WIDTH } from './IconButton.constants'
import styles from './IconButton.module.scss'
import type { IconButtonProps } from './IconButton.types'

/**
 * Кнопка только с иконкой: переключатели видов в боковых полосах, закрытие вкладки,
 * «открыть проект». Подпись обязательна - это и подсказка, и имя для скринридера.
 * Кнопка с текстом - Button.
 */
export const IconButton = ({
  icon: Icon,
  label,
  size = 'md',
  active,
  tooltipPlacement,
  type = 'button',
  ...rest
}: IconButtonProps) => (
  <Tooltip label={label} placement={tooltipPlacement}>
    <button
      type={type}
      aria-label={label}
      aria-pressed={active}
      className={clsx(styles.iconButton, styles[size], active && styles.active)}
      {...rest}>
      <Icon size={ICON_SIZE[size]} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
    </button>
  </Tooltip>
)
