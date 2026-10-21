import type { MenuPoint } from './EditorContextMenu.types'

/** Нажатие в координатах окна - точка в редакторе: меню встаёт у курсора мыши. */
export const pointInEditor = (
  client: { x: number; y: number },
  editor: { left: number; top: number },
): MenuPoint => ({ x: client.x - editor.left, y: client.y - editor.top })

/**
 * Меню с клавиатуры - под кареткой, как у Monaco: левый край каретки, низ строки. Без
 * модели Monaco места каретки не знает (null) - меню не открывается.
 */
export const pointUnderCaret = (
  caret: { left: number; top: number; height: number } | null,
): MenuPoint | null => caret && { x: caret.left, y: caret.top + caret.height }
