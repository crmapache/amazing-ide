import styles from './Kbd.module.scss'
import type { KbdProps } from './Kbd.types'

/**
 * Сочетание клавиш плашками: подсказка в пункте меню, в пустом состоянии, в
 * подсказке у кнопки. Только показывает - само сочетание вешает тот, кто поставил.
 */
export const Kbd = ({ keys }: KbdProps) => (
  <kbd className={styles.kbd}>
    {/* Ключ с позицией: в сочетании клавиша может повториться (G G). */}
    {keys.map((key, index) => (
      <kbd key={`${index}:${key}`} className={styles.key}>
        {key}
      </kbd>
    ))}
  </kbd>
)
