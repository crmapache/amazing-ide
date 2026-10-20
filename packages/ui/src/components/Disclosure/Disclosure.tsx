import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

import { DISCLOSURE_CHEVRON_SIZE, DISCLOSURE_CHEVRON_STROKE_WIDTH } from './Disclosure.constants'
import styles from './Disclosure.module.scss'
import type { DisclosureProps } from './Disclosure.types'

/**
 * Строка, которая раскрывает то, что под ней: вызов инструмента с выводом, шапка
 * карточки субагента, список задач. Стрелка слева поворачивается вниз, как в дереве
 * файлов. Раскрывать нечего (disabled) - стрелка прячется, но место держит, и подписи
 * соседних строк стоят ровно. Что раскрывается, рисует тот, кто поставил строку.
 */
export const Disclosure = ({
  expanded,
  size = 'sm',
  disabled = false,
  type = 'button',
  children,
  ...rest
}: DisclosureProps) => (
  <button
    type={type}
    disabled={disabled}
    aria-expanded={disabled ? undefined : expanded}
    className={clsx(styles.disclosure, styles[size], expanded && !disabled && styles.expanded)}
    {...rest}>
    <ChevronRight
      className={clsx(styles.chevron, disabled && styles.hidden)}
      size={DISCLOSURE_CHEVRON_SIZE}
      strokeWidth={DISCLOSURE_CHEVRON_STROKE_WIDTH}
      aria-hidden
    />
    {children}
  </button>
)
