import styles from './ProgressBar.module.scss'
import type { ProgressBarProps } from './ProgressBar.types'

/**
 * Тонкая полоса прогресса: скачивание обновления, клонирование. Доля известна -
 * полоса; если нет, лучше текст «…ing», а не вечная анимация.
 */
export const ProgressBar = ({ value, label }: ProgressBarProps) => (
  <progress
    aria-label={label}
    className={styles.progressBar}
    value={Math.min(1, Math.max(0, value))}
    max={1}
  />
)
