import clsx from 'clsx'

import { ProgressBar } from '../ProgressBar/ProgressBar'
import styles from './Toast.module.scss'
import type { ToastProps } from './Toast.types'

/**
 * Карточка уведомления: заголовок, пояснение, полоса прогресса, действия. Сама себя
 * не позиционирует - её кладут в зону уведомлений окна, которая и решает, где и в
 * каком порядке они стоят.
 */
export const Toast = ({ title, description, tone = 'neutral', progress, actions }: ToastProps) => (
  <div role="status" className={clsx(styles.toast, styles[tone])}>
    <div className={styles.title}>{title}</div>
    {description && <div className={styles.description}>{description}</div>}
    {progress !== undefined && (
      <div className={styles.progress}>
        <ProgressBar value={progress} label={title} />
      </div>
    )}
    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
)
