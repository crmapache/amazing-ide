import type { ChangeEvent } from 'react'
import { useId } from 'react'

import { useChangeEnd } from './Slider.hooks'
import styles from './Slider.module.scss'
import type { SliderProps } from './Slider.types'

/**
 * Ползунок числа на нативном `<input type="range">`: стрелки, Home и End, скринридер и
 * сама шкала - от браузера, в тоне акцента (accent-color). Своя отрисовка шкалы
 * потребовала бы градиента, а его в стиле нет (ADR 0006).
 */
export const Slider = ({
  label,
  hideLabel = false,
  value,
  min,
  max,
  step = 1,
  valueText,
  disabled = false,
  onChange,
  onChangeEnd,
}: SliderProps) => {
  const id = useId()
  const gestureEnd = useChangeEnd(onChangeEnd)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(event.currentTarget.value))

  return (
    <div className={styles.slider}>
      {!hideLabel && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.row}>
        <input
          id={id}
          type="range"
          className={styles.input}
          aria-label={hideLabel ? label : undefined}
          aria-valuetext={valueText}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          onPointerDown={gestureEnd.onPointerDown}
          onKeyUp={gestureEnd.onKeyUp}
        />
        {valueText && <span className={styles.value}>{valueText}</span>}
      </div>
    </div>
  )
}
