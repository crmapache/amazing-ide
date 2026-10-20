import type { PaintedTerm } from '@shared/claude-search'
import { wordsOf, foldWord, paintLength } from '@shared/claude-search-words'

import type { QueryWord, QueryPhrase } from './search-query'
import { parseQuery, withinEdits } from './search-query'
import { snippetAround } from './search-snippets'
import {
  BM25_B,
  BM25_K1,
  STEM_CUT,
  STEM_MIN,
  FUZZY_MIN,
  STEM_KEEP,
  PREFIX_MIN,
  WEIGHT_STEM,
  PREFIX_LIMIT,
  WEIGHT_EXACT,
  WEIGHT_FUZZY,
  FUZZY_TWO_MIN,
  WEIGHT_PREFIX,
  COMPACT_MIN_DEAD,
} from './search.constants'
import type { Found, SearchOptions, IndexedMessage } from './search.types'

type Doc = { message: IndexedMessage; length: number; alive: boolean }

type Variant = { painted: PaintedTerm; weight: number }

/** Что одно слово запроса набрало по сообщениям, и какими термами оно нашлось. */
type WordScores = { scores: Map<number, number>; variants: Map<string, PaintedTerm> }

const NOTHING: Found = { hits: [], terms: [], total: 0, chatTotal: 0, conversations: 0 }

/** Два отсортированных списка - в один отсортированный. */
const merged = (left: readonly string[], right: readonly string[]): string[] => {
  const result: string[] = []
  let i = 0
  let j = 0

  while (i < left.length && j < right.length) {
    const a = left[i] ?? ''
    const b = right[j] ?? ''

    if (a < b) {
      result.push(a)
      i += 1
    } else {
      result.push(b)
      j += 1
    }
  }

  return result.concat(left.slice(i), right.slice(j))
}

/**
 * Индекс сообщений и сам поиск: инвертированный индекс с BM25, свой, а не библиотека
 * (Fuse.js ищет имена, не тела сообщений). Каждое слово запроса обязано найтись; слово
 * ищется как набрано, по началу, с одной-двумя опечатками и по усечённой основе; фраза в
 * кавычках должна стоять как написана.
 *
 * В отличие от ACC индекс дописывается, а не строится заново: здесь он живёт в главном
 * процессе, и пересборка на каждое обновление живого разговора задерживала бы всё окно.
 * Сообщения добавляются, разговор целиком снимается отметкой, а когда мёртвых больше
 * живых - индекс собирается заново из живых.
 */
export class TextIndex {
  private docs: Doc[] = []
  private postings = new Map<string, number[]>()
  private byConversation = new Map<string, number[]>()
  /** Все термы по порядку - начало слова находится делением пополам. */
  private vocabulary: string[] = []
  /** Новые термы, ещё не вставленные в словарь: вставляются разом перед поиском. */
  private fresh: string[] = []
  private alive = 0
  private dead = 0
  private totalLength = 0

  /** Сколько живых сообщений - для тестов и журнала, никогда не слова. */
  get size(): number {
    return this.alive
  }

  add(messages: readonly IndexedMessage[]): void {
    for (const message of messages) this.addOne(message)
  }

  /** Разговор уходит целиком: перечитан с начала, откат, файл исчез. */
  removeConversation(conversation: string): void {
    for (const id of this.byConversation.get(conversation) ?? []) {
      const doc = this.docs[id]

      if (!doc?.alive) continue

      doc.alive = false
      this.alive -= 1
      this.dead += 1
      this.totalLength -= doc.length
    }

    this.byConversation.delete(conversation)

    if (this.dead >= COMPACT_MIN_DEAD && this.dead > this.alive) this.compact()
  }

  /**
   * Сообщения по запросу, лучшие первыми. Счёт разговора окна и всего проекта - одним
   * проходом: скоринг для обеих областей одинаков, а второй поиск ради бейджа стоил бы
   * вдвое на каждом нажатии. Match case и Whole words - проверка текста кандидата, а не
   * второй индекс: термы свёрнуты, и только текст знает регистр и отдельность слова.
   * Равные по счёту - свежие первыми.
   */
  search(query: string, options: SearchOptions): Found {
    const parsed = parseQuery(query)
    const unique = new Map<string, QueryWord>()

    for (const word of [...parsed.words, ...parsed.phrases.flatMap((phrase) => phrase.words)]) {
      unique.set(options.matchCase ? `${word.term}\u0000${word.raw}` : word.term, word)
    }

    if (unique.size === 0) return NOTHING

    this.settleVocabulary()

    const perWord = [...unique.values()].map((word) => this.scoresFor(word, options))
    const smallest = perWord.reduce((best, item) =>
      item.scores.size < best.scores.size ? item : best,
    )
    const scored: { doc: number; score: number }[] = []

    for (const doc of smallest.scores.keys()) {
      const total = this.totalOf(doc, perWord)

      if (total !== null && this.stands(doc, perWord, parsed.phrases, options)) {
        scored.push({ doc, score: total })
      }
    }

    return this.answer(scored, perWord, options)
  }

  private addOne(message: IndexedMessage) {
    const id = this.docs.length
    const words = wordsOf(message.text)
    const counts = new Map<string, number>()

    for (const word of words) counts.set(word.term, (counts.get(word.term) ?? 0) + 1)

    this.docs.push({ message, length: words.length, alive: true })
    this.alive += 1
    this.totalLength += words.length

    for (const [term, count] of counts) {
      let list = this.postings.get(term)

      if (!list) {
        list = []
        this.postings.set(term, list)
        this.fresh.push(term)
      }

      list.push(id, count)
    }

    const own = this.byConversation.get(message.conversation)

    if (own) own.push(id)
    else this.byConversation.set(message.conversation, [id])
  }

  private compact() {
    const living = this.docs.filter((doc) => doc.alive).map((doc) => doc.message)

    this.docs = []
    this.postings = new Map()
    this.byConversation = new Map()
    this.vocabulary = []
    this.fresh = []
    this.alive = 0
    this.dead = 0
    this.totalLength = 0
    this.add(living)
  }

  private settleVocabulary() {
    if (this.fresh.length === 0) return

    this.vocabulary = merged(this.vocabulary, [...this.fresh].sort())
    this.fresh = []
  }

  /** Сумма по словам запроса; null - какого-то слова в сообщении нет. */
  private totalOf(doc: number, perWord: readonly WordScores[]): number | null {
    let total = 0

    for (const { scores } of perWord) {
      const score = scores.get(doc)

      if (score === undefined) return null

      total += score
    }

    return total
  }

  /** Фразы стоят как написаны, и под переключателями поля каждое слово стоит как просили. */
  private stands(
    doc: number,
    perWord: readonly WordScores[],
    phrases: readonly QueryPhrase[],
    options: SearchOptions,
  ): boolean {
    const text = this.docs[doc]?.message.text ?? ''

    if (phrases.length > 0) {
      const haystack = options.matchCase ? text : foldWord(text)

      if (
        !phrases.every((phrase) =>
          haystack.includes(options.matchCase ? phrase.raw : phrase.folded),
        )
      ) {
        return false
      }
    }

    if (!options.matchCase && !options.wholeWords) return true

    const words = wordsOf(text)

    return perWord.every(({ variants }) =>
      words.some((word) => {
        const painted = variants.get(word.term)

        return painted !== undefined && paintLength(word, painted, text) !== null
      }),
    )
  }

  private answer(
    scored: readonly { doc: number; score: number }[],
    perWord: readonly WordScores[],
    options: SearchOptions,
  ): Found {
    const messageOf = (doc: number) => (this.docs[doc] as Doc).message
    const inChat = scored.filter(
      (item) => messageOf(item.doc).conversation === options.conversation,
    )
    // «Этот чат» у вкладки без разговора - пусто, а не весь проект под чужим счётчиком.
    const shown = options.onlyThatChat ? inChat : scored
    const ordered = [...shown]
      .sort((a, b) => b.score - a.score || messageOf(b.doc).at - messageOf(a.doc).at)
      .slice(0, options.limit)

    // Один способ красить на терм - самый широкий: «use» и «user» оба начинают usercard.
    const matched = new Map<string, PaintedTerm>()

    for (const { variants } of perWord) {
      for (const painted of variants.values()) {
        const known = matched.get(painted.term)

        if (!known || painted.paint > known.paint) matched.set(painted.term, painted)
      }
    }

    const hits = ordered.map(({ doc, score }) => {
      const message = messageOf(doc)

      return { message, score, ...snippetAround(message.text, matched) }
    })
    // Красить стоит только слова, которые есть в показанном.
    const visible = new Set<string>()

    for (const hit of hits) {
      for (const word of wordsOf(hit.message.text))
        if (matched.has(word.term)) visible.add(word.term)
    }

    return {
      hits,
      terms: [...visible].sort().map((term) => matched.get(term) as PaintedTerm),
      total: scored.length,
      chatTotal: inChat.length,
      conversations: new Set(scored.map((item) => messageOf(item.doc).conversation)).size,
    }
  }

  /** Лучший счёт каждого сообщения по одному слову запроса - по всем путям, которыми оно находится. */
  private scoresFor(word: QueryWord, options: SearchOptions): WordScores {
    const scores = new Map<number, number>()
    const variants = new Map<string, PaintedTerm>()
    const average = Math.max(1, this.totalLength / Math.max(1, this.alive))

    for (const variant of this.variantsOf(word, options)) {
      const list = this.postings.get(variant.painted.term) ?? []
      let documents = 0

      for (let index = 0; index < list.length; index += 2) {
        if (this.docs[list[index] ?? 0]?.alive) documents += 1
      }

      if (documents === 0) continue

      const idf = Math.log(1 + (this.alive - documents + 0.5) / (documents + 0.5))

      for (let index = 0; index < list.length; index += 2) {
        const doc = this.docs[list[index] ?? 0]

        if (!doc?.alive) continue

        const count = list[index + 1] ?? 0
        const saturated =
          (count * (BM25_K1 + 1)) /
          (count + BM25_K1 * (1 - BM25_B + (BM25_B * doc.length) / average))
        const score = idf * saturated * variant.weight
        const id = list[index] ?? 0

        if (score > (scores.get(id) ?? -1)) scores.set(id, score)
      }

      variants.set(variant.painted.term, variant.painted)
    }

    return { scores, variants }
  }

  /**
   * Термы, за которые может стоять слово запроса: оно само, потом слова, которые оно
   * начинает (поиск отвечает по мере набора), потом опечатки (только у длинных слов и
   * только при выключенном Match case - у опечатки нет набранных букв), последней -
   * усечённая основа: «наследует» находит «наследовал» и «наследование», а настоящий
   * стеммер был бы по одному на язык. Whole words - только само слово.
   */
  private variantsOf(word: QueryWord, options: SearchOptions): Variant[] {
    const variants = new Map<string, Variant>()
    const typed = word.term
    const painted = (term: string, paint: number): PaintedTerm => ({
      term,
      paint,
      ...(options.matchCase ? { text: word.raw.slice(0, paint) } : {}),
      ...(options.wholeWords ? { whole: true } : {}),
    })

    if (this.postings.has(typed))
      variants.set(typed, { painted: painted(typed, typed.length), weight: WEIGHT_EXACT })
    if (options.wholeWords) return [...variants.values()]
    if (typed.length >= PREFIX_MIN)
      this.addPrefixed(typed, typed.length, WEIGHT_PREFIX, variants, painted)

    const distance = options.matchCase
      ? 0
      : typed.length >= FUZZY_TWO_MIN
        ? 2
        : typed.length >= FUZZY_MIN
          ? 1
          : 0

    if (distance > 0) {
      for (const term of this.vocabulary) {
        if (variants.has(term) || Math.abs(term.length - typed.length) > distance) continue
        if (withinEdits(typed, term, distance)) {
          variants.set(term, { painted: painted(term, term.length), weight: WEIGHT_FUZZY })
        }
      }
    }

    if (typed.length >= STEM_MIN) {
      const stem = typed.slice(0, Math.max(STEM_KEEP, typed.length - STEM_CUT))

      this.addPrefixed(stem, stem.length, WEIGHT_STEM, variants, painted)
    }

    return [...variants.values()]
  }

  /** Термы, которые начинаются с prefix, не больше PREFIX_LIMIT новых. */
  private addPrefixed(
    prefix: string,
    paint: number,
    weight: number,
    into: Map<string, Variant>,
    painted: (term: string, paint: number) => PaintedTerm,
  ) {
    let count = 0

    for (let index = this.lowerBound(prefix); index < this.vocabulary.length; index += 1) {
      const term = this.vocabulary[index] ?? ''

      if (!term.startsWith(prefix) || count >= PREFIX_LIMIT) break
      if (into.has(term)) continue

      into.set(term, { painted: painted(term, paint), weight })
      count += 1
    }
  }

  private lowerBound(word: string): number {
    let low = 0
    let high = this.vocabulary.length

    while (low < high) {
      const middle = (low + high) >>> 1

      if ((this.vocabulary[middle] ?? '') < word) low = middle + 1
      else high = middle
    }

    return low
  }
}
