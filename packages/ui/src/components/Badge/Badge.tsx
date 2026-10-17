import clsx from 'clsx'

import styles from './Badge.module.scss'
import type { BadgeProps } from './Badge.types'

/**
 * Метка состояния: точка цвета состояния и короткий текст. Статус в строке списка,
 * счётчик, «ahead 2» у ветки. Это не кнопка - нажимать на неё нечего.
 */
export const Badge = ({ tone = 'neutral', variant = 'marker', children }: BadgeProps) => (
  <span className={clsx(styles.badge, styles[tone], styles[variant])}>{children}</span>
)
