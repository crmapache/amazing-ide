import type { SendKey } from '@shared/claude-prefs'

/**
 * Что делает Enter в поле при выбранной клавише отправки (Settings → Sending a message).
 * В режиме Enter отправляет и Cmd/Ctrl+Enter - это вторая половина настройки, и
 * привыкший к ней не должен встретить мёртвую клавишу. В режиме Cmd/Ctrl+Enter любой
 * другой Enter переносит строку, Shift+Enter тоже. Правило ломается молча - держит тест.
 */
export const enterAction = (
  key: SendKey,
  event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
): 'send' | 'newline' => {
  const mod = event.metaKey || event.ctrlKey

  if (key === 'modEnter') return mod ? 'send' : 'newline'

  return event.shiftKey && !mod ? 'newline' : 'send'
}

/** Клавиша отправки словами - для подсказки на Send и для строки в Settings. */
export const sendKeyKeys = (key: SendKey): string[] =>
  key === 'modEnter' ? ['⌘', 'Enter'] : ['Enter']
