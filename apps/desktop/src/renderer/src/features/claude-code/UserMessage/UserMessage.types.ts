import type { DraftChip, EditorRef, DraftToken, MessageDraft } from '@shared/claude-draft'
import type { UserFeedItem } from '@shared/claude-feed'

import type { PictureSource } from '../picture.types'

export type UserMessageProps = {
  item: UserFeedItem
}

export type MessageActionsProps = {
  item: UserFeedItem
  /** Сообщение кусками - для копии и возврата в поле. */
  draft: MessageDraft
}

export type MessageBodyProps = {
  tokens: readonly DraftToken[]
  /** id сообщения: вставленная картинка без файла берётся из его строки в транскрипте. */
  messageId: string
  /** Открыть картинку сообщения крупно по её номеру среди вставленных. */
  onOpenImage: (index: number) => void
  /** Открыть крупно выбранную картинку - её файл. */
  onOpenPicture: (source: PictureSource, chip: DraftChip) => void
}

/** Открытая крупно выбранная картинка и что на ней. */
export type OpenedPicture = { source: PictureSource; label: string }

export type PastedTextProps = {
  chip: DraftChip
  /** Последняя в сообщении: свёрнутая занимает всю ширину и показывает первые строки. */
  isBlock: boolean
}

export type MessageImagesProps = {
  item: UserFeedItem
  /** Какая картинка открыта крупно; null - никакая. */
  opened: number | null
  onOpen: (index: number | null) => void
}

export type EditorLineProps = {
  editor: EditorRef
}

export type SentChipProps = {
  chip: DraftChip
  /** Картинка за чипом - превью под курсором; нет - чип не картинка или её не достать. */
  picture?: PictureSource | null | undefined
  /** Картинка открывается крупно. Не задано - чип картинки просто плашка с превью. */
  onOpen?: (() => void) | undefined
}
