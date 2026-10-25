import type { ModelFamily } from './model-chip.types'

/** Семьи моделей от длинного имени к короткому: opusplan раньше opus. */
export const MODEL_FAMILIES: readonly ModelFamily[] = [
  'fable',
  'opusplan',
  'opus',
  'sonnet',
  'haiku',
]

/**
 * Знак быстрого режима на MODEL и в меню: глиф, а не эмодзи (эмодзи красит себя сам, а
 * знак берёт цвет того, что говорит). Не текст интерфейса - его не переводят.
 */
export const FAST_MARK = '↯'
