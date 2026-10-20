import type { PaintedTerm } from '@shared/claude-search'
import type { WordSpan } from '@shared/claude-search-words'
import { wordsOf, paintLength } from '@shared/claude-search-words'

import { ELLIPSIS, SNIPPET_LEAD, SNIPPET_WINDOW } from './search.constants'

/** Сколько можно сдвинуть край куска к пробелу, чтобы не резать слово. */
const BOUNDARY_REACH = 20

export type Snippet = { snippet: string; spans: [number, number][] }

/** Найденные слова в границах [start, end) текста - в координатах куска (сдвиг shift). */
const spansWithin = (
  text: string,
  words: readonly WordSpan[],
  matched: ReadonlyMap<string, PaintedTerm>,
  bounds: { start: number; end: number; shift: number },
): [number, number][] => {
  const spans: [number, number][] = []

  for (const word of words) {
    if (word.start < bounds.start || word.end > bounds.end) continue

    const painted = matched.get(word.term)
    const length = painted ? paintLength(word, painted, text) : null

    if (length === null) continue

    const from = word.start + bounds.shift
    const to = from + length
    const last = spans.at(-1)

    // Часть длинного слова внутри уже закрашенного ничего не добавляет.
    if (last && last[0] <= from && to <= last[1]) continue

    spans.push([from, to])
  }

  return spans
}

/**
 * Кусок сообщения для строки списка: окно вокруг первого найденного слова, с началом
 * чуть раньше, чтобы слово читалось в своём предложении, и края по пробелу - кусок с
 * «gram» в начале читается как чужая фраза. Без совпадения (находка модели) - начало.
 */
export const snippetAround = (text: string, matched: ReadonlyMap<string, PaintedTerm>): Snippet => {
  const words = wordsOf(text)

  if (text.length <= SNIPPET_WINDOW) {
    return {
      snippet: text,
      spans: spansWithin(text, words, matched, { start: 0, end: text.length, shift: 0 }),
    }
  }

  const first = words.find((word) => {
    const painted = matched.get(word.term)

    return painted !== undefined && paintLength(word, painted, text) !== null
  })
  let start = first ? Math.max(0, first.start - SNIPPET_LEAD) : 0
  let end = Math.min(text.length, start + SNIPPET_WINDOW)

  if (end === text.length) start = Math.max(0, end - SNIPPET_WINDOW)

  if (start > 0) {
    const boundary = text.lastIndexOf(' ', start + BOUNDARY_REACH)

    if (boundary >= start && (!first || boundary <= first.start)) start = boundary + 1
  }

  if (end < text.length) {
    const boundary = text.lastIndexOf(' ', end)

    if (boundary > start + SNIPPET_WINDOW / 2 && (!first || boundary >= first.end)) end = boundary
  }

  const lead = start > 0 ? ELLIPSIS : ''
  const tail = end < text.length ? ELLIPSIS : ''
  const piece = text.slice(start, end)
  const trimmed = piece.trim()
  // Обрезка пробелов сдвигает слова - мерить от того, что на экране.
  const shift = lead.length - (piece.length - piece.trimStart().length) - start

  return {
    snippet: lead + trimmed + tail,
    spans: spansWithin(text, words, matched, { start, end, shift }),
  }
}
