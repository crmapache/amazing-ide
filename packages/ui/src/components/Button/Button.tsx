import clsx from 'clsx'

import { BUTTON_ICON_SIZE, BUTTON_ICON_STROKE_WIDTH } from './Button.constants'
import styles from './Button.module.scss'
import type { ButtonProps } from './Button.types'

/**
 * Кнопка с текстом: действие в тосте, пустом состоянии, диалоге. primary - главное
 * действие (тонированное оранжевым), secondary - рядом с главным, ghost - тихое.
 * Кнопка только с иконкой - IconButton.
 */
export const Button = ({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  icon: Icon,
  children,
  ...rest
}: ButtonProps) => (
  <button type={type} className={clsx(styles.button, styles[variant], styles[size])} {...rest}>
    {Icon && (
      <Icon
        className={styles.icon}
        size={BUTTON_ICON_SIZE[size]}
        strokeWidth={BUTTON_ICON_STROKE_WIDTH}
        aria-hidden
      />
    )}
    {children}
  </button>
)
