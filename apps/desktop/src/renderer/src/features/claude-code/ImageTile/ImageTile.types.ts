export type ImageTileProps = {
  /** Миниатюра или превью; пусто - картинку не прочитать, вместо неё значок. */
  src: string
  /** Что это за картинка - подпись кнопки открытия и alt. */
  label: string
  /** Открыть крупно. Нет - плитка не нажимается. */
  onOpen?: (() => void) | undefined
  /** Убрать из сообщения (вложение в поле ввода). */
  onRemove?: (() => void) | undefined
  removeLabel?: string | undefined
}
