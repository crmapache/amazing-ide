/** sm - рядом с мелким текстом (строки ленты, поле поиска), md - рядом с основным. */
export type SpinnerSize = 'sm' | 'md'

/** accent - работа, за которой следят (задача в работе); neutral - тихое ожидание. */
export type SpinnerTone = 'accent' | 'neutral'

export type SpinnerProps = {
  size?: SpinnerSize | undefined
  tone?: SpinnerTone | undefined
  /** Что ждём - для скринридера. Нет - знак декоративный, слова стоят рядом. */
  label?: string | undefined
}
