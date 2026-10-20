import type { PaintedTerm, SearchSpeaker } from '@shared/claude-search'

/**
 * Сообщение, как его знает поиск: найти, показать и прыгнуть к нему - и ничего больше.
 * uuid - имя строки транскрипта, anchor - id элемента ленты (см. SearchHit.anchor).
 */
export type IndexedMessage = {
  conversation: string
  uuid: string
  anchor: string
  /** Мс эпохи; 0 - строка не несла времени. */
  at: number
  speaker: SearchSpeaker
  text: string
}

/** Найденное сообщение и что показать из него. */
type TextHit = {
  message: IndexedMessage
  score: number
  snippet: string
  spans: [number, number][]
}

/** Как искать: разговор окна (его находки считаются отдельно), только он, переключатели поля. */
export type SearchOptions = {
  conversation: string | null
  onlyThatChat: boolean
  limit: number
  matchCase: boolean
  wholeWords: boolean
}

/**
 * Ответ на запрос: что показать, какие слова красить, сколько нашлось всего, в разговоре
 * окна и в скольких разговорах. Счёт - до обрезки по лимиту.
 */
export type Found = {
  hits: TextHit[]
  terms: PaintedTerm[]
  total: number
  chatTotal: number
  conversations: number
}
