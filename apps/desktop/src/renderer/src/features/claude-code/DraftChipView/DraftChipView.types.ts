import type { DraftChip } from '@shared/claude-draft'

import type { PictureSource } from '../picture.types'

export type DraftChipViewProps = {
  chip: DraftChip
  /** Картинка за чипом - превью под курсором; нет - обычная подсказка. */
  picture?: PictureSource | null | undefined
  /** Клик по чипу открывает картинку: превью так и говорит. */
  opens?: boolean | undefined
  /** Чип в поле: крестик убирает его, у свёрнутой вставки ещё «развернуть». */
  onRemove?: (() => void) | undefined
  onExpand?: (() => void) | undefined
}
