import type { ToolsResult, ToolsFailure } from '@shared/claude-tools'

import { CliReplyError, CliExitedError } from '../cli/cli-process'
import type { CliRun } from './cli-run'
import { maskText } from './secret-mask'

export const failed = (failure: ToolsFailure, detail = ''): ToolsResult => ({
  ok: false,
  failure,
  detail,
  needsConsent: false,
})

/**
 * Отказ управляющего запроса: текст CLI (он английский и человеку понятен) - в detail,
 * закрывшийся процесс - кодом. Прочее - в журнал: это сбой панели, а не CLI.
 */
export const failureOf = (error: unknown): { failure: ToolsFailure; detail: string } => {
  if (error instanceof CliReplyError) return { failure: 'refused', detail: maskText(error.message) }
  if (error instanceof CliExitedError) return { failure: 'process-exited', detail: '' }

  console.warn('[claude] запрос к CLI не прошёл:', error)

  return { failure: 'failed', detail: '' }
}

/**
 * Итог разовой команды для экрана: удалась ли и что сказал CLI (ошибка - stderr, иначе
 * stdout), без ключей - CLI повторяет адрес маркетплейса как есть. Не запустилась или
 * не уложилась во время - failed: код null.
 */
export const resultOf = (run: CliRun): ToolsResult => {
  const ok = run.code === 0
  const text = (ok ? run.stdout : run.stderr || run.stdout).trim()
  // Установка печатает «Installing…» и «✔ …» слитно - галочка с новой строки.
  const detail = maskText(text.replace(/([^\n])([✔✘])/g, '$1\n$2'))

  if (!ok && run.code === null) console.warn('[claude] команда CLI не завершилась:', text)

  return {
    ok,
    failure: ok ? null : run.code === null ? 'failed' : 'refused',
    detail,
    needsConsent: !ok && /--yes|-y\b/.test(text),
  }
}
