import { wordsOf, foldWord } from '@shared/claude-search-words'

/** Слово запроса: свёрнутое - для индекса, как набрано - для Match case. */
export type QueryWord = { term: string; raw: string }

/** Фраза в кавычках: свёрнутая, как набрана, и её слова. */
export type QueryPhrase = { folded: string; raw: string; words: QueryWord[] }

/** Запрос как набран: слова и фразы в кавычках. */
export type ParsedQuery = { words: QueryWord[]; phrases: QueryPhrase[] }

/** Кавычки любого вида: прямые, ёлочки, лапки. */
const QUOTED = /["«»“”„]([^"«»“”„]+)["«»“”„]/g

/**
 * Слова как набраны - только прогоны целиком: набранное «UserCard» - одно слово, а не
 * оно и две его половины, которые тоже пришлось бы найти.
 */
const queryWords = (text: string): QueryWord[] =>
  wordsOf(text)
    .filter((word) => word.whole)
    .map((word) => ({ term: word.term, raw: text.slice(word.start, word.end) }))

/** Разбор запроса: фразы в кавычках отдельно, остальное - словами без повторов. */
export const parseQuery = (text: string): ParsedQuery => {
  const phrases = [...text.matchAll(QUOTED)]
    .map((match) => (match[1] ?? '').trim())
    .map((raw) => ({ folded: foldWord(raw), raw, words: queryWords(raw) }))
    .filter((phrase) => phrase.folded !== '')
  const rest = text.replace(QUOTED, ' ')
  const seen = new Set<string>()
  const words = queryWords(rest).filter((word) => {
    const key = `${word.term}\u0000${word.raw}`

    if (seen.has(key)) return false

    seen.add(key)

    return true
  })

  return { words, phrases }
}

/**
 * Расстояние Дамерау-Левенштейна с потолком: ответ только «в пределах limit» или нет,
 * поэтому счёт обрывается, как только строка таблицы целиком выше потолка.
 */
export const withinEdits = (a: string, b: string, limit: number): boolean => {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > limit) return false
  if (a.length === 0 || b.length === 0) return true

  let beforePrevious: number[] | null = null
  let previous = Array.from({ length: b.length + 1 }, (_value, index) => index)
  let current = new Array<number>(b.length + 1).fill(0)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i

    let best = i

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )

      if (beforePrevious && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, (beforePrevious[j - 2] ?? 0) + 1)
      }

      current[j] = value
      best = Math.min(best, value)
    }

    if (best > limit) return false

    const recycled: number[] = beforePrevious ?? new Array<number>(b.length + 1).fill(0)

    beforePrevious = previous
    previous = current
    current = recycled
  }

  return (previous[b.length] ?? 0) <= limit
}
