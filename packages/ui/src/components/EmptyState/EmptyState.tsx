import { EMPTY_STATE_ICON_SIZE, EMPTY_STATE_ICON_STROKE_WIDTH } from './EmptyState.constants'
import styles from './EmptyState.module.scss'
import type { EmptyStateProps } from './EmptyState.types'

/**
 * Пустая зона с объяснением: нет проекта, не выбран файл, вид ещё не сделан.
 * Занимает всё место родителя и центрирует содержимое.
 */
export const EmptyState = ({ title, description, icon: Icon, action }: EmptyStateProps) => (
  <div className={styles.emptyState}>
    {Icon && (
      <Icon
        className={styles.icon}
        size={EMPTY_STATE_ICON_SIZE}
        strokeWidth={EMPTY_STATE_ICON_STROKE_WIDTH}
        aria-hidden
      />
    )}
    <div className={styles.title}>{title}</div>
    {description && <div className={styles.description}>{description}</div>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
)
