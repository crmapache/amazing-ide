import { PREVIEW_WINDOW_CHARS, TEXT_MATCHES_PER_FILE_LIMIT } from './search.constants'

/** Где в строке совпадение: в символах JS (UTF-16), не в байтах. */
export type MatchSpan = { start: number; length: number }

/** Кусок строки для списка результатов и где в нём подсветить совпадение. */
export type MatchPreview = { preview: string; matchStart: number; matchLength: number }

/** Строка файла с совпадением: номер с 1 и текст без перевода строки. */
export type LineHit = { line: number; text: string }

const ELLIPSIS = '…'

const LEADING_INDENT = /^[ \t]+/

/**
 * Регистр складывается по одной букве с картой «буква сложенной строки -> индекс в
 * исходной». Нужно редким строкам, где toLowerCase меняет длину (İ -> i̇): там
 * позиция в сложенной строке не равна позиции в исходной.
 */
const foldWithOffsets = (text: string) => {
  const offsets: number[] = []
  let folded = ''
  let index = 0

  for (const char of text) {
    const lower = char.toLowerCase()

    for (let unit = 0; unit < lower.length; unit += 1) offsets.push(index)
    folded += lower
    index += char.length
  }

  offsets.push(text.length)

  return { folded, offsets }
}

/** Первое вхождение без учёта регистра в индексах исходной строки. Нет - null. */
export const locateMatch = (text: string, query: string): MatchSpan | null => {
  const needle = query.toLowerCase()
  const folded = text.toLowerCase()

  // Обычный случай: длина не изменилась - каждая буква сложилась в одну, и индексы
  // сложенной строки совпадают с исходными.
  if (folded.length === text.length) {
    const start = folded.indexOf(needle)

    return start === -1 ? null : { start, length: needle.length }
  }

  const source = foldWithOffsets(text)
  const target = foldWithOffsets(query).folded
  const at = source.folded.indexOf(target)

  if (at === -1) return null

  const start = source.offsets[at] ?? 0
  const end = source.offsets[at + target.length] ?? text.length

  return { start, length: end - start }
}

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff

const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff

/**
 * Окно вокруг совпадения в длинной строке. Пару суррогатов (эмодзи) не разрезаем.
 * clipped - строка продолжается за концом body, и «…» справа нужно и у её конца.
 */
const windowAround = (body: string, span: MatchSpan, clipped: boolean): MatchPreview => {
  const visible = Math.min(span.length, PREVIEW_WINDOW_CHARS)
  const before = Math.floor((PREVIEW_WINDOW_CHARS - visible) / 2)
  let from = Math.max(0, Math.min(span.start - before, body.length - PREVIEW_WINDOW_CHARS))
  let to = Math.min(body.length, from + PREVIEW_WINDOW_CHARS)

  if (from > 0 && isLowSurrogate(body.charCodeAt(from))) from -= 1
  if (to < body.length && isHighSurrogate(body.charCodeAt(to - 1))) to += 1

  const head = from > 0 ? ELLIPSIS : ''
  const tail = to < body.length || clipped ? ELLIPSIS : ''

  return {
    preview: head + body.slice(from, to) + tail,
    matchStart: head.length + span.start - from,
    matchLength: Math.max(0, Math.min(span.length, to - span.start)),
  }
}

/**
 * Превью строки с совпадением. Отступ слева и хвост справа срезаются (но не внутри
 * совпадения), длинная строка - окном вокруг первого совпадения с «…» по краям.
 * Совпадение ищется здесь же, по тексту, который увидит человек: колонки git -
 * в байтах, а окно считает символы. Не нашлось (свёртка регистра у git и JS
 * разошлась или совпадение дальше сохранённой части огромной строки) - строка
 * показывается без подсветки. clipped - text лишь начало строки.
 */
export const buildPreview = (text: string, query: string, clipped = false): MatchPreview => {
  const span = locateMatch(text, query) ?? { start: 0, length: 0 }
  const matchEnd = span.start + span.length
  const indent = Math.min(LEADING_INDENT.exec(text)?.[0].length ?? 0, span.start)
  const end = Math.max(text.trimEnd().length, matchEnd)
  const body = text.slice(indent, end)
  const shifted = { start: span.start - indent, length: span.length }

  if (body.length <= PREVIEW_WINDOW_CHARS) {
    const preview = clipped ? body + ELLIPSIS : body

    return { preview, matchStart: shifted.start, matchLength: shifted.length }
  }

  return windowAround(body, shifted, clipped)
}

/**
 * Строки файла с текстом без учёта регистра, не больше предела на файл. Сначала
 * быстрая проверка всего файла: в большинстве файлов совпадений нет вовсе.
 */
export const findMatchingLines = (content: string, query: string): LineHit[] => {
  const needle = query.toLowerCase()

  if (!content.toLowerCase().includes(needle)) return []

  const hits: LineHit[] = []
  const lines = content.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const text = (lines[index] ?? '').replace(/\r$/, '')

    if (locateMatch(text, query) !== null) hits.push({ line: index + 1, text })
    if (hits.length === TEXT_MATCHES_PER_FILE_LIMIT) break
  }

  return hits
}
