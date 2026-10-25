import type { DraftToken, PicturePlace } from '@shared/claude-draft'

import type { PictureSource } from '../picture.types'
import { chipPicture } from '../picture.utils'

const pad = (value: number): string => String(value).padStart(2, '0')

// Пустая строка - одна или несколько подряд, в том числе из одних пробелов.
const BLANK_LINES = /\n[^\S\n]*\n(?:[^\S\n]*\n)*/

/**
 * Кусок текста абзацами: граница - пустая строка. Одиночный перенос остаётся в абзаце,
 * пустая строка уходит целиком - на её месте лента ставит короткий зазор, а не высоту
 * целой строки.
 */
export const splitParagraphs = (text: string): string[] => text.split(BLANK_LINES)

/** Время сообщения в шапке - ЧЧ:ММ по часам машины; 0 - время неизвестно, пусто. */
export const formatClock = (time: number): string => {
  if (time <= 0) return ''

  const date = new Date(time)

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Картинка за каждым чипом сообщения (null - не картинка). Вставленная, у которой нет
 * файла, берётся из строки сообщения в транскрипте - по её месту среди вставленных.
 */
export const messagePictures = (
  tokens: readonly DraftToken[],
  ordinals: readonly number[],
  conversationId: string,
  messageId: string,
): (PictureSource | null)[] =>
  tokens.map((token, index) => {
    if (token.kind !== 'chip') return null

    const image = ordinals[index] ?? -1
    const said: PicturePlace | null =
      image >= 0 && conversationId && messageId
        ? { kind: 'said', conversationId, messageId, image }
        : null

    return chipPicture(token.chip, said)
  })
