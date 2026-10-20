import type { TFunction } from 'i18next'

import type { Conversation, ClosedConversation } from '@shared/claude'
import type { SoundEvent } from '@shared/claude-prefs'

import type { ClosableTabCall, ClosableTabTone } from '@amazing-ide/ui/ClosableTab.types'

import { CALL_TONES, SWAP_GAP_PX, GROUP_TONE_COUNT } from './ConversationTabs.constants'
import type { Box, Shot, TabRect } from './ConversationTabs.types'

/** Имя вкладки на полосе: своё, «Fork of …» у нерождённого форка, иначе «New chat». */
export const tabName = (
  conversation: Pick<Conversation | ClosedConversation, 'title' | 'fork'>,
  t: TFunction,
): string =>
  conversation.title ||
  (conversation.fork
    ? t('claudeCode.forkTitle', {
        title: conversation.fork.sourceTitle || t('claudeCode.newChat'),
      })
    : t('claudeCode.newChat'))

/**
 * Цвет группы - по её id, а не по номеру вкладки: цвет не съезжает, когда рядом
 * открывают и закрывают другие. Простое умножение плохо мешает похожие строки, поэтому
 * финальное перемешивание MurmurHash3: малая разница на входе - другой цвет на выходе.
 */
export const groupTone = (groupId: string): ClosableTabTone => {
  let hash = 0

  for (let index = 0; index < groupId.length; index += 1) {
    hash = Math.imul(hash ^ groupId.charCodeAt(index), 0x01000193)
  }

  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x85ebca6b)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xc2b2ae35)
  hash ^= hash >>> 16

  return (Math.abs(hash) % GROUP_TONE_COUNT) as ClosableTabTone
}

/** Цвет повода, которым светится позвавшая вкладка: успех, внимание, ошибка. */
export const callTone = (reason: SoundEvent): ClosableTabCall => CALL_TONES[reason]

/**
 * Соседняя вкладка для клавиш «следующая» и «предыдущая» - по кругу, как вкладки
 * редактора: клавиша, умирающая на последней вкладке, читается как сломанная.
 */
export const tabBeside = (order: readonly string[], current: string, step: 1 | -1): string => {
  if (order.length === 0) return ''

  const at = order.indexOf(current)

  if (at < 0) return (step > 0 ? order[0] : order.at(-1)) ?? ''

  return order[(at + step + order.length) % order.length] ?? ''
}

/**
 * Снимок полосы на начало жеста: единицы (группы целиком или вкладки одной группы) по
 * порядку, ряды и коробки единиц по рядам. Все решения жеста - по этому снимку, а не
 * по живой картинке: иначе сосед отходит, геометрия меняется, условие срабатывает снова.
 */
export const shotOf = (rects: readonly TabRect[]): Shot => {
  const units: string[] = []

  for (const rect of rects) {
    if (rect.unit !== undefined && units.at(-1) !== rect.unit) units.push(rect.unit)
  }

  const tops = rects.filter((rect) => rect.unit !== undefined).map((rect) => rect.top)
  const lines = [...new Set(tops)].sort((one, two) => one - two)
  const boxes: Box[] = []

  for (const rect of rects) {
    if (rect.unit === undefined) continue

    const index = units.indexOf(rect.unit)
    const line = lines.indexOf(rect.top)
    const last = boxes.at(-1)

    if (last?.index === index && last.line === line) {
      last.left = Math.min(last.left, rect.left)
      last.right = Math.max(last.right, rect.right)
    } else {
      boxes.push({ index, line, left: rect.left, right: rect.right })
    }
  }

  return { units, lines, boxes }
}

/**
 * Ряд под несомой вкладкой: ближайший к её верху, и рука держит свой ряд, пока другой
 * не ближе на запас - иначе вкладка, которую ведут вдоль ряда чуть ниже, прыгала бы.
 */
export const rowFor = (lines: readonly number[], top: number, current: number): number => {
  let nearest = current

  for (const [line, lineTop] of lines.entries()) {
    if (Math.abs(lineTop - top) < Math.abs((lines[nearest] ?? Infinity) - top)) nearest = line
  }

  const held = lines[current]
  const near = lines[nearest]

  if (nearest === current || held === undefined || near === undefined) return nearest

  return Math.abs(near - top) + SWAP_GAP_PX <= Math.abs(held - top) ? nearest : current
}

/**
 * Куда просится несомая единица: её место в порядке, когда рука над рядом line и
 * сдвинута на dx. Сосед уступает, когда передний край несомой прошёл его середину. На
 * чужом ряду, не пройдя ни одной середины, единица встаёт у ближнего края ряда: конец
 * одного ряда и начало следующего - одно место в порядке.
 */
export const placeOn = (
  boxes: readonly Box[],
  from: number,
  carried: Box,
  line: number,
  dx: number,
): number => {
  const left = carried.left + dx
  const right = carried.right + dx
  const others = boxes.filter((box) => box.line === line && box.index !== from)
  let place = from

  for (const box of others) {
    const middle = (box.left + box.right) / 2

    if (box.index < from && left < middle) place = Math.min(place, box.index)
    if (box.index > from && right > middle) place = Math.max(place, box.index)
  }

  if (place !== from || line === carried.line || others.length === 0) return place

  const indices = others.map((box) => box.index)

  return line < carried.line ? Math.max(...indices) + 1 : Math.min(...indices) - 1
}

/** Перед какой единицей встанет брошенная (null - в конец): уехав вперёд - за последней уступившей. */
export const beforeOf = (units: readonly string[], from: number, place: number): string | null =>
  (place > from ? units[place + 1] : units[place]) ?? null
