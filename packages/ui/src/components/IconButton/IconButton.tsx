import clsx from 'clsx'

import { Tooltip } from '../Tooltip/Tooltip'
import { ICON_SIZE, ICON_STROKE_WIDTH } from './IconButton.constants'
import styles from './IconButton.module.scss'
import type { IconButtonProps } from './IconButton.types'

/**
 * Кнопка только с иконкой: переключатели видов в боковых полосах, закрытие вкладки,
 * «открыть проект», отправка сообщения (primary). Подпись обязательна - это и
 * подсказка, и имя для скринридера. Недоступная, которая объясняет почему, -
 * aria-disabled вместо disabled: подсказка всплывает, нажатие ничего не делает.
 * Кнопка с текстом - Button.
 */
export const IconButton = ({
  icon: Icon,
  label,
  size = 'md',
  variant = 'ghost',
  active,
  tooltipPlacement,
  type = 'button',
  onClick,
  ...rest
}: IconButtonProps) => {
  const isUnavailable = rest['aria-disabled'] === true || rest['aria-disabled'] === 'true'

  return (
    <Tooltip label={label} placement={tooltipPlacement}>
      <button
        type={type}
        aria-label={label}
        aria-pressed={active}
        className={clsx(styles.iconButton, styles[size], styles[variant], active && styles.active)}
        onClick={isUnavailable ? undefined : onClick}
        {...rest}>
        <Icon size={ICON_SIZE[size]} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </button>
    </Tooltip>
  )
}
