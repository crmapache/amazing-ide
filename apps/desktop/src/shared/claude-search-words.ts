/**
 * Как текст режется на слова для поиска по разговорам - одно правило на обе стороны.
 * Главный процесс по нему строит индекс и называет найденные слова, окно по нему же
 * красит эти слова в ленте. В ACC правило было написано дважды (Kotlin и страница) и
 * держалось одинаковыми тестами; здесь обе стороны на TypeScript, и код один - разойтись
 * им нечем. Чистые функции без Node и браузера: файл едет в оба процесса.
 *
 * Слово - прогон букв, цифр и знаков при них. Подчёркивание и всё прочее слово кончает,
 * смена регистра или вида внутри прогона даёт части рядом с целым: `oldestEventUuid` -
 * это и он сам, и oldest, Event, Uuid. Сравнение - в свёрнутом виде: строчные, без
 * акцентов, ё как е - так люди набирают слова в поле поиска.
 */

import type { PaintedTerm } from './claude-search'

/** Слово в тексте: свёрнутое и где стоит; whole - прогон целиком, а не часть camelCase. */
export type WordSpan = { term: string; start: number; end: number; whole: boolean }

const WORD = /[\p{L}\p{N}\p{M}]+/gu

/** Всё, что дальше ASCII: только там бывают акценты. */
const BEYOND_ASCII = /[^\x20-\x7e]/

const MARKS = /\p{Mn}/gu

/** Строчные, без акцентов, ё как е - вид слова в поле поиска. */
export const foldWord = (word: string): string => {
  const lowered = word.toLowerCase()

  return BEYOND_ASCII.test(lowered) ? lowered.normalize('NFD').replace(MARKS, '') : lowered
}

const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase()
const isLower = (c: string) => c !== c.toUpperCase() && c === c.toLowerCase()
const isDigit = (c: string) => /\p{N}/u.test(c)

/**
 * Где прогон делится: перед заглавной после строчной или цифры (oldestEvent, v2Beta),
 * перед последней из заглавных, с которой начинается строчное слово (HTTPServer - HTTP,
 * Server), и между буквами и цифрами (utf8 - utf, 8).
 */
const partsOf = (run: string): [number, number][] => {
  const parts: [number, number][] = []
  let from = 0

  for (let index = 1; index < run.length; index += 1) {
    const previous = run.charAt(index - 1)
    const current = run.charAt(index)
    const next = run.charAt(index + 1)
    const breaks =
      (isUpper(current) && (isLower(previous) || isDigit(previous))) ||
      (isUpper(current) && isUpper(previous) && next !== '' && isLower(next)) ||
      isDigit(current) !== isDigit(previous)

    if (breaks) {
      parts.push([from, index])
      from = index
    }
  }

  parts.push([from, run.length])

  return parts
}

/** Все слова текста - прогоны целиком и их части - с местом каждого. */
export const wordsOf = (text: string): WordSpan[] => {
  const words: WordSpan[] = []

  for (const match of text.matchAll(WORD)) {
    const start = match.index
    const run = match[0]
    const whole = foldWord(run)

    words.push({ term: whole, start, end: start + run.length, whole: true })

    const parts = partsOf(run)

    if (parts.length < 2) continue

    for (const [from, to] of parts) {
      const part = foldWord(run.slice(from, to))

      if (part !== whole)
        words.push({ term: part, start: start + from, end: start + to, whole: false })
    }
  }

  return words
}

/**
 * Сколько букв слова красить, или null - под переключателями поля это не совпадение:
 * часть длинного слова при Whole words или буквы не в том регистре при Match case.
 */
export const paintLength = (word: WordSpan, painted: PaintedTerm, text: string): number | null => {
  if (painted.whole && !word.whole) return null

  const length = Math.min(painted.paint, word.end - word.start)

  if (painted.text !== undefined) {
    const typed = painted.text.slice(0, length)

    if (text.slice(word.start, word.start + typed.length) !== typed) return null
  }

  return length
}

/**
 * Где в тексте стоят найденные слова - что красить. Слово красится, когда оно - один из
 * термов, и ровно настолько, насколько скажет терм (paintLength). Часть внутри уже
 * закрашенного прогона ничего не добавляет.
 */
export const matchSpans = (text: string, terms: readonly PaintedTerm[]): [number, number][] => {
  if (terms.length === 0) return []

  const wanted = new Map(terms.map((term) => [term.term, term]))
  const spans: [number, number][] = []

  for (const word of wordsOf(text)) {
    const painted = wanted.get(word.term)
    const length = painted ? paintLength(word, painted, text) : null

    if (length === null) continue

    const end = word.start + length
    const last = spans.at(-1)

    if (last && last[0] <= word.start && end <= last[1]) continue

    spans.push([word.start, end])
  }

  return spans
}
