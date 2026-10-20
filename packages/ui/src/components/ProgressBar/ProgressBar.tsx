import clsx from 'clsx'

import styles from './ProgressBar.module.scss'
import type { ProgressBarProps } from './ProgressBar.types'

/**
 * Тонкая полоса прогресса: скачивание обновления, клонирование, занятый контекст
 * разговора. Доля известна - полоса; если нет, на короткое ожидание лучше текст «…ing», а
 * бегущий отрезок (без value) - только на долгое. Тон предупреждает, что запас кончается.
 */
export const ProgressBar = ({ value, label, tone = 'accent' }: ProgressBarProps) =>
  value === undefined ? (
    // Своя дорожка, а не <progress> без value: вид неопределённого нативного браузер
    // рисует по-своему, и плоской заливкой тона его не сделать.
    <span role="progressbar" aria-label={label} className={clsx(styles.progressBar, styles[tone])}>
      <span className={styles.sweep} />
    </span>
  ) : (
    <progress
      aria-label={label}
      className={clsx(styles.progressBar, styles[tone])}
      value={Math.min(1, Math.max(0, value))}
      max={1}
    />
  )
