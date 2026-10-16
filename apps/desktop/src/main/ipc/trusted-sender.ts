import type { WebFrameMain } from 'electron'

/**
 * Запрос пришёл из нашего окна, а не из чужой страницы. Сейчас других страниц в
 * приложении нет, но провайдеры LLM могут принести свои webview - и тогда
 * обработчики IDE не должны отвечать никому, кроме окна самой IDE.
 */
export const isTrustedSender = (frame: WebFrameMain | null, rendererUrl: string | undefined) => {
  if (!frame) return false

  const url = new URL(frame.url)

  if (rendererUrl) return url.origin === new URL(rendererUrl).origin

  return url.protocol === 'file:'
}
