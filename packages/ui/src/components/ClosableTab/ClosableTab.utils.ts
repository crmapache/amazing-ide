import {
  ELLIPSIS,
  CUT_TAIL_MAX,
  CUT_HEAD_LEAST,
  CUT_SPLIT_FROM,
  WIDE_CHARACTER,
  UNSPACED_SCRIPT,
  CUT_UNSPACED_TAIL,
} from './ClosableTab.constants'

/** Ширина текста в колонках: иероглиф и полноширинный знак рисуются в две. */
export const columns = (text: string): number =>
  Array.from(text).reduce((sum, char) => sum + (WIDE_CHARACTER.test(char) ? 2 : 1), 0)

/**
 * Имя в двух частях, чтобы узкая вкладка резала его посередине, а не с конца: голова
 * уходит в многоточие, хвост остаётся. «Refactor auth module» и «Refactor auth tests»
 * с конца режутся одинаково, а различает их конец. Хвост - последнее слово с пробелом
 * перед ним; слово длиннее CUT_TAIL_MAX колонок (путь, имя функции) хвостом не берётся,
 * имя режется с конца. Китайский и японский пишутся без пробелов: хвост - последние
 * CUT_UNSPACED_TAIL знака.
 */
export const splitTitle = (title: string): { head: string; tail: string } => {
  const whole = { head: title, tail: '' }

  if (columns(title) < CUT_SPLIT_FROM) return whole

  const space = title.lastIndexOf(' ')

  if (space > 0) {
    const width = columns(title.slice(space + 1))

    if (width === 0 || width > CUT_TAIL_MAX || !title.slice(0, space).trim()) return whole

    return { head: title.slice(0, space), tail: title.slice(space) }
  }

  if (!UNSPACED_SCRIPT.test(title)) return whole

  const chars = Array.from(title)

  return {
    head: chars.slice(0, -CUT_UNSPACED_TAIL).join(''),
    tail: chars.slice(-CUT_UNSPACED_TAIL).join(''),
  }
}

/**
 * Ширина куска имени [from, to) в пикселях - меряет тот, у кого есть шрифт (Range по
 * самому имени на вкладке). Чистая функция ниже меряет только через неё.
 */
export type MeasureSlice = (from: number, to: number) => number

/** Самое длинное начало head из целых букв, влезающее в budget; null - не влезает и least букв. */
const headIn = (head: string, budget: number, least: number, measure: MeasureSlice) => {
  const stops = [0]

  for (const letter of head) stops.push((stops.at(-1) ?? 0) + letter.length)

  let low = 0
  let high = stops.length - 1

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)

    if (measure(0, stops[middle] ?? 0) <= budget) low = middle
    else high = middle - 1
  }

  return low < least ? null : head.slice(0, stops[low]).trimEnd()
}

/**
 * Имя, как оно влезает в room пикселей: целиком, если влезает, иначе голова до
 * многоточия и хвост (splitTitle). Хвост, оставляющий голове меньше CUT_HEAD_LEAST
 * букв, бросается - имя режется с конца. Считается, а не отдаётся `text-overflow`:
 * браузер ставит многоточие, где кончилась последняя целая буква, и перед хвостом
 * оставался зазор.
 */
export const fitMiddle = (
  title: string,
  room: number,
  measure: MeasureSlice,
  ellipsisWidth: number,
): string => {
  if (measure(0, title.length) <= room + 0.5) return title

  const { head, tail } = splitTitle(title)

  if (tail) {
    const budget = room - ellipsisWidth - measure(head.length, title.length)
    const kept = headIn(head, budget, CUT_HEAD_LEAST, measure)

    if (kept !== null) return `${kept}${ELLIPSIS}${tail}`
  }

  return `${headIn(title, room - ellipsisWidth, 0, measure) ?? ''}${ELLIPSIS}`
}
