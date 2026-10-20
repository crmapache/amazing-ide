/** Очки нечёткого сравнения. Подобраны так, чтобы кусок целиком и начала слов шли выше россыпи. */
export const MATCH_SCORE = {
  char: 1,
  consecutive: 5,
  wordStart: 8,
  prefix: 10,
  substring: 15,
  exact: 50,
  gap: -1,
  /** За каждый символ текста: из равных совпадений выше короткое имя. */
  length: -0.05,
} as const

/** Символы, после которых начинается новое слово: путь, расширение, kebab и snake. */
export const WORD_SEPARATORS: ReadonlySet<string> = new Set(['/', '.', '-', '_', ' '])
