import clsx from 'clsx'

import styles from './Toast.module.scss'
import type { ToastProps } from './Toast.types'

/**
 * Карточка уведомления: заголовок, пояснение, действия. Сама себя не позиционирует -
 * её кладут в зону уведомлений окна, которая и решает, где и в каком порядке они стоят.
 */
export const Toast = ({ title, description, tone = 'neutral', actions }: ToastProps) => (
  <div role="status" className={clsx(styles.toast, styles[tone])}>
    <div className={styles.title}>{title}</div>
    {description && <div className={styles.description}>{description}</div>}
    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
)
