import type { TextRange } from '@amazing-ide/ui/ListBoxOption.types'

import { MATCH_SCORE, WORD_SEPARATORS } from './search-everywhere.constants'
import type { FuzzyMatch } from './search-everywhere.types'

/** Начало слова: первый символ, символ после разделителя или заглавная после строчной. */
const isWordStart = (text: string, index: number): boolean => {
  if (index === 0) return true

  const previous = text[index - 1] ?? ''
  const current = text[index] ?? ''

  if (WORD_SEPARATORS.has(previous)) return true

  return current !== current.toLowerCase() && previous === previous.toLowerCase()
}

/** Хватит ли текста после позиции, чтобы совпал остаток запроса по порядку. */
const canMatchRest = (query: string, from: number, lower: string, start: number): boolean => {
  let position = start

  for (let index = from; index < query.length; index++) {
    position = lower.indexOf(query[index] ?? '', position)
    if (position < 0) return false
    position++
  }

  return true
}

/**
 * Позиции букв запроса в тексте, по порядку. Из подходящих вхождений буквы берётся
 * лучшее, после которого остаток запроса ещё совпадает: сразу за прошлой буквой,
 * иначе начало слова, иначе ближайшее. Так «ftv» ложится на File-Tree-View, а не на
 * первые попавшиеся f, t, v.
 */
const pickPositions = (query: string, text: string, lower: string): number[] | null => {
  const positions: number[] = []
  let start = 0

  for (let index = 0; index < query.length; index++) {
    const char = query[index] ?? ''
    const previous = positions.at(-1)
    const nearest = lower.indexOf(char, start)

    if (nearest < 0) return null

    let chosen = nearest

    if (previous === undefined || nearest !== previous + 1) {
      for (
        let candidate = nearest;
        candidate >= 0;
        candidate = lower.indexOf(char, candidate + 1)
      ) {
        if (isWordStart(text, candidate) && canMatchRest(query, index + 1, lower, candidate + 1)) {
          chosen = candidate
          break
        }
      }
    }

    positions.push(chosen)
    start = chosen + 1
  }

  return positions
}

/** Соседние позиции - одним куском: так их и подсвечивать. */
const toRanges = (positions: readonly number[]): TextRange[] => {
  const ranges: TextRange[] = []

  for (const position of positions) {
    const last = ranges.at(-1)

    if (last && last.start + last.length === position) last.length++
    else ranges.push({ start: position, length: 1 })
  }

  return ranges
}

/** Лучшее вхождение запроса целым куском: с начала слова, если такое есть. */
const findSubstring = (query: string, text: string, lower: string): number => {
  const first = lower.indexOf(query)

  for (let index = first; index >= 0; index = lower.indexOf(query, index + 1)) {
    if (isWordStart(text, index)) return index
  }

  return first
}

const scoreSubstring = (query: string, text: string, lower: string, index: number) =>
  query.length * (MATCH_SCORE.char + MATCH_SCORE.consecutive) +
  MATCH_SCORE.substring +
  (isWordStart(text, index) ? MATCH_SCORE.wordStart : 0) +
  (index === 0 ? MATCH_SCORE.prefix : 0) +
  (lower === query ? MATCH_SCORE.exact : 0) +
  text.length * MATCH_SCORE.length

// Пропуск до начала следующего слова не штрафуется: «ftv» по File-Tree-View - это
// хорошее совпадение, а не россыпь. Штраф - только за прыжок в середину слова.
const scorePositions = (text: string, positions: readonly number[]) =>
  positions.reduce((score, position, index) => {
    const previous = positions[index - 1]
    const isConsecutive = previous !== undefined && position === previous + 1
    const isAtWordStart = isWordStart(text, position)
    const gap = previous === undefined ? 0 : position - previous - 1

    return (
      score +
      MATCH_SCORE.char +
      (isConsecutive ? MATCH_SCORE.consecutive : 0) +
      (isAtWordStart ? MATCH_SCORE.wordStart : 0) +
      (index === 0 && position === 0 ? MATCH_SCORE.prefix : 0) +
      (isAtWordStart ? 0 : gap * MATCH_SCORE.gap)
    )
  }, text.length * MATCH_SCORE.length)

/**
 * Нечёткое сравнение, как в поиске WebStorm: буквы запроса идут в тексте по
 * порядку, но не обязательно подряд. Без учёта регистра. Не совпало - null.
 * query - уже в нижнем регистре, lower - text в нижнем регистре (его готовят заранее
 * для тысяч файлов, а не на каждую букву).
 */
export const fuzzyMatch = (query: string, text: string, lower = text.toLowerCase()) => {
  if (query === '') return { score: 0, ranges: [] } satisfies FuzzyMatch
  if (!canMatchRest(query, 0, lower, 0)) return null

  const substring = findSubstring(query, text, lower)

  if (substring >= 0) {
    return {
      score: scoreSubstring(query, text, lower, substring),
      ranges: [{ start: substring, length: query.length }],
    } satisfies FuzzyMatch
  }

  const positions = pickPositions(query, text, lower)

  if (!positions) return null

  return {
    score: scorePositions(text, positions),
    ranges: toRanges(positions),
  } satisfies FuzzyMatch
}
