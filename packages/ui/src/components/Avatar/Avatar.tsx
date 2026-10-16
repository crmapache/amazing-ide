import clsx from 'clsx'

import styles from './Avatar.module.scss'
import type { AvatarProps } from './Avatar.types'

/**
 * Цветной квадрат с инициалами: значок проекта в шапке, позже - аккаунта или
 * провайдера. Декоративный: рядом всегда есть имя текстом.
 */
export const Avatar = ({ initials, tone }: AvatarProps) => (
  <span aria-hidden className={clsx(styles.avatar, styles[`tone${tone}`])}>
    {initials}
  </span>
)
