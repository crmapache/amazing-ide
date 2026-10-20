import type { CliMessage } from '../cli/cli-messages'
import { recordField, stringField, parseCliLine } from '../cli/cli-messages'

/**
 * Строки, на которых CLI соглашается резать форк (`--resume-session-at`), замер ACC на
 * 2.1.280: ответ, вызов и результат, вложение, stop_hook_summary. На прочей строке
 * процесс умирает с «No message found».
 */
const isCuttable = (message: CliMessage) =>
  message['isSidechain'] !== true &&
  stringField(message, 'uuid') !== '' &&
  (message.type === 'assistant' ||
    message.type === 'user' ||
    message.type === 'attachment' ||
    (message.type === 'system' && message.subtype === 'stop_hook_summary'))

/**
 * Где резать форк перед сообщением человека. at - строка, до которой форк несёт
 * разговор (включительно); start - сообщение первое, нести нечего; missing - такого
 * сообщения в транскрипте нет (или нет строки над ним, которую CLI примет).
 */
export type ForkAnchor = { kind: 'at'; uuid: string } | { kind: 'start' } | { kind: 'missing' }

/**
 * Имена строк: своё и, у сообщения, написанного посреди хода, - вложение очереди, в
 * котором CLI хранит его под нашим uuid (`attachment.source_uuid`).
 */
const namesOf = (message: CliMessage): string[] => {
  const own = stringField(message, 'uuid')
  const queued = stringField(recordField(message, 'attachment'), 'source_uuid')

  return queued ? [own, queued] : [own]
}

/** Последняя строка цепочки, которую CLI примет: форк всего разговора. null - нести нечего. */
export const forkLeaf = (lines: readonly string[]): string | null => {
  const leaf = lines
    .map(parseCliLine)
    .filter((message) => message !== null)
    .findLast(isCuttable)

  return leaf ? stringField(leaf, 'uuid') : null
}

/**
 * Точка форка перед сообщением beforeUuid: его родитель и дальше вверх по цепочке,
 * пока не найдётся строка, которую CLI примет.
 */
export const forkAnchor = (lines: readonly string[], beforeUuid: string): ForkAnchor => {
  const messages = lines.map(parseCliLine).filter((message) => message !== null)
  const byUuid = new Map(messages.map((message) => [stringField(message, 'uuid'), message]))
  const target = messages.find((message) => namesOf(message).includes(beforeUuid))

  if (!target) return { kind: 'missing' }

  const seen = new Set<string>()
  let current = stringField(target, 'parentUuid')

  if (!current) return { kind: 'start' }

  while (current && !seen.has(current)) {
    seen.add(current)

    const message = byUuid.get(current)

    if (!message) return { kind: 'missing' }
    if (isCuttable(message)) return { kind: 'at', uuid: current }

    current = stringField(message, 'parentUuid')
  }

  // Выше сообщения - только строки, на которых CLI не режет: нести нечего.
  return { kind: 'start' }
}
