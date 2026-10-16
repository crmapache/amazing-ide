import clsx from 'clsx'

import styles from './Button.module.scss'
import type { ButtonProps } from './Button.types'

/**
 * Кнопка с текстом: действие в тосте, пустом состоянии, диалоге. primary - главное
 * действие, secondary - рядом с главным, ghost - тихое. Кнопка только с иконкой -
 * IconButton.
 */
export const Button = ({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  children,
  ...rest
}: ButtonProps) => (
  <button type={type} className={clsx(styles.button, styles[variant], styles[size])} {...rest}>
    {children}
  </button>
)
