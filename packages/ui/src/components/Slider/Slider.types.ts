export type SliderProps = {
  /** Что меняет ползунок: подпись для скринридера и строка над шкалой. */
  label: string
  /** Подпись не видна (стоит в строке, где и так ясно, что это): только для скринридера. */
  hideLabel?: boolean | undefined
  value: number
  min: number
  max: number
  step?: number | undefined
  /** Значение словами справа от шкалы: «70%», «Full colour». Нет - справа пусто. */
  valueText?: string | undefined
  disabled?: boolean | undefined
  onChange: (value: number) => void
  /**
   * Жест кончился: ползунок отпустили или подвинули клавишей. Для того, что нужно раз
   * на движение, а не на каждый процент: проба громкости.
   */
  onChangeEnd?: (() => void) | undefined
}
