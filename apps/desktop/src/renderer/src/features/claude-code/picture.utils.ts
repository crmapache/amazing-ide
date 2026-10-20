import type { DraftChip, PicturePlace } from '@shared/claude-draft'

import { isPastedImage } from './draft.utils'
import type { PictureSource } from './picture.types'

/** Сетевой путь: его главный процесс не читает, и превью над ним не обещается. */
const NETWORK_PATH = /^(\/\/|\\\\)/

/**
 * Картинка за чипом - или null у чипа, за которым её нет (как в ACC). Сначала байты в самом
 * чипе (вставленная в поле), потом файл (выбранная - это путь, вставленную IDE записала),
 * последним - что знает место, где нарисован чип (elsewhere): очередь держит байты для
 * отправки, транскрипт - картинку в строке сообщения.
 */
export const chipPicture = (
  chip: DraftChip,
  elsewhere: PicturePlace | null = null,
): PictureSource | null => {
  if (chip.kind !== 'img') return null
  if (chip.data) return { data: chip.data }

  const isPasted = isPastedImage(chip)
  const path = chip.path || (isPasted ? '' : chip.value)

  if (path) {
    return NETWORK_PATH.test(path)
      ? null
      : { place: { kind: 'file', path }, ...(isPasted ? {} : { name: path }) }
  }

  return elsewhere ? { place: elsewhere } : null
}

/** Место картинки строкой - для ключа кэша. */
export const placeKey = (place: PicturePlace): string => JSON.stringify(place)
