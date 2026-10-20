import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

import { CHEVRON_SIZE, CHEVRON_STROKE_WIDTH } from './DropdownButton.constants'
import styles from './DropdownButton.module.scss'
import type { DropdownButtonProps } from './DropdownButton.types'

/**
 * Тихая кнопка с текущим значением и стрелкой вниз: открывает список, из которого
 * выбирают (проект, ветка; в размере sm - модель и режим под полем ввода). Сам
 * список рисует тот, кто кнопку поставил.
 */
export const DropdownButton = ({
  label,
  leading,
  menuLabel,
  size = 'md',
  type = 'button',
  ...rest
}: DropdownButtonProps) => (
  <button
    type={type}
    aria-haspopup="menu"
    aria-label={`${menuLabel}: ${label}`}
    className={clsx(styles.dropdownButton, styles[size])}
    {...rest}>
    {leading}
    <span className={styles.label}>{label}</span>
    <ChevronDown
      className={styles.chevron}
      size={CHEVRON_SIZE[size]}
      strokeWidth={CHEVRON_STROKE_WIDTH}
      aria-hidden
    />
  </button>
)
