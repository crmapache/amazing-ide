import type { ImageAttachment } from '@shared/claude'
import type { EditorRef, DraftQuote, DraftToken, MessageDraft } from '@shared/claude-draft'

/** Черновик поля ввода: текст с вложениями вперемешку и цитаты над полем. */
export type ComposerDraft = { tokens: DraftToken[]; quotes: DraftQuote[] }

/** Сообщение к отправке: текст для CLI, картинки, куски для ленты и очереди, открытый файл. */
export type OutgoingMessage = {
  text: string
  images: ImageAttachment[]
  draft: MessageDraft
  editor: EditorRef | null
}
