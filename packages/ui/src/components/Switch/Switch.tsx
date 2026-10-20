import { useId } from 'react'
import clsx from 'clsx'

import styles from './Switch.module.scss'
import type { SwitchProps } from './Switch.types'

/**
 * Строка настройки с переключателем «вкл/выкл»: подпись и пояснение слева, ползунок
 * справа. Нажимается вся строка. Для выбора одного из нескольких - MenuItem с selection,
 * для числа - Slider.
 */
export const Switch = ({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: SwitchProps) => {
  const descriptionId = useId()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? descriptionId : undefined}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <span className={clsx(styles.track, checked && styles.on)} aria-hidden>
        <span className={styles.thumb} />
      </span>
    </button>
  )
}
