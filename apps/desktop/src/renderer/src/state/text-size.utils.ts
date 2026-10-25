import { TEXT_SIZE } from './text-size.constants'

/**
 * Размер текста из чего угодно - сохранённого, шага, значения ползунка: на сетке шага и в
 * пределах. Не число (запись испорчена, поля нет) - размер по умолчанию, а не ноль.
 */
export const clampTextSize = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return TEXT_SIZE.default

  const snapped = Math.round(value / TEXT_SIZE.step) * TEXT_SIZE.step

  return Math.min(TEXT_SIZE.max, Math.max(TEXT_SIZE.min, snapped))
}

/** Соседняя ступень (⌘+ и ⌘-); у края остаётся на краю. */
export const steppedTextSize = (textSize: number, direction: 1 | -1): number =>
  clampTextSize(textSize + direction * TEXT_SIZE.step)

/** Размер из записи localStorage: в ней может лежать что угодно от прошлых версий. */
export const restoreTextSize = (persisted: unknown): number =>
  clampTextSize(
    typeof persisted === 'object' && persisted !== null && 'textSize' in persisted
      ? persisted.textSize
      : undefined,
  )

/** Множитель для токенов: 115 процентов - 1.15. */
export const fontScaleOf = (textSize: number): string => String(textSize / 100)
