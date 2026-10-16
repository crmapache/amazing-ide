import styles from './NotificationArea.module.scss'
import type { NotificationAreaProps } from './NotificationArea.types'

/**
 * Угол окна для уведомлений (Toast). Фичи кладут сюда свои карточки, а зона
 * решает, где они стоят и как складываются в стопку, - чтобы два уведомления
 * не легли друг на друга.
 */
export const NotificationArea = ({ children }: NotificationAreaProps) => (
  <div className={styles.notificationArea}>{children}</div>
)
