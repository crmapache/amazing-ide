import type { CliMessage } from '../cli/cli-messages'
import { isRecord, recordField, stringField, parseCliLine } from '../cli/cli-messages'
import { EMPTY_TEXT_PLACEHOLDER } from '../feed/feed.constants'
import { BLOCK_MEMORY, MAX_TEXT_CHARS } from './search.constants'
import type { IndexedMessage } from './search.types'

/** Что строка транскрипта даёт поиску. */
export type TranscriptLine =
  | { kind: 'message'; message: IndexedMessage }
  | { kind: 'aiTitle'; title: string }
  /** Имя от человека; пустое - имя сняли. */
  | { kind: 'customTitle'; title: string }
  /** Метка отката: отрезанное ещё в файле и уйдёт после чтения. */
  | { kind: 'rewind' }

/**
 * Сколько блоков каждого сообщения модели уже прошло: номер блока - часть id элемента
 * ленты (`id:номер`), а CLI пишет блоки сообщения отдельными строками подряд. Помнится
 * несколько последних - строки одного сообщения другими сообщениями модели не перебиваются.
 */
export type BlockCounts = [string, number][]

const USER = '"type":"user"'
const ASSISTANT = '"type":"assistant"'
const TOOL_RESULT = '"type":"tool_result"'
const TEXT_BLOCK = '"type":"text"'
const INTERRUPTED = '[Request interrupted'
/** Строки, которые не сообщения, но нужны поиску: имена разговора и метка отката. */
const MARKS = ['"type":"ai-title"', '"type":"custom-title"', '"rewound":true']

const REMINDER = /<system-reminder>[\s\S]*?<\/system-reminder>/g
const SHELL_INPUT = /<bash-input>([\s\S]*?)<\/bash-input>/g
const SHELL_REST = /<bash-(stdout|stderr|exit-code)>[\s\S]*?<\/bash-\1>/g
const BLANK_LINES = /\n[ \t]*\n(?:[ \t]*\n)+/g
const COMMAND_NAME = /<command-name>([\s\S]*?)<\/command-name>/
const COMMAND_ARGS = /<command-args>([\s\S]*?)<\/command-args>/

/** Текстовые блоки содержимого: строка у простого сообщения человека, массив - у остальных. */
const textBlocks = (content: unknown): string[] => {
  if (typeof content === 'string') return [content]
  if (!Array.isArray(content)) return []

  return content
    .filter(isRecord)
    .filter((block) => block['type'] === 'text')
    .map((block) => stringField(block, 'text'))
}

/**
 * Слова человека без обёрток CLI. Команда «/» остаётся командой («/deploy staging» вполне
 * ищут), команда «!» - своей строкой без вывода (вывод - машины, и `git status` сотней
 * копий отвечал бы на любое имя файла), напоминания и уведомления CLI уходят целиком.
 * shellOnly - кроме команд «!» слов нет: в ленте это карточка команды, а не сообщение.
 */
const personWords = (raw: string): { text: string; shellOnly: boolean } | null => {
  const text = raw.trim()

  if (text.startsWith('<command-name>') || text.startsWith('<command-message>')) {
    const name = COMMAND_NAME.exec(text)?.[1]?.trim() ?? ''
    const args = COMMAND_ARGS.exec(text)?.[1]?.trim() ?? ''
    const command = args ? `${name} ${args}` : name

    return command ? { text: command, shellOnly: false } : null
  }

  if (text.startsWith('<local-command-') || text.startsWith('<task-notification>')) return null
  if (text.startsWith(INTERRUPTED)) return null

  const bare = text.replace(REMINDER, '')
  const words = bare
    .replace(SHELL_INPUT, (_match, command: string) => `! ${command.trim()}`)
    .replace(SHELL_REST, '')
    .replace(BLANK_LINES, '\n\n')
    .trim()
  const own = bare.replace(SHELL_INPUT, '').replace(SHELL_REST, '').trim()

  return words ? { text: words, shellOnly: own === '' } : null
}

const timeOf = (line: CliMessage) => {
  const at = Date.parse(stringField(line, 'timestamp'))

  return Number.isFinite(at) ? at : 0
}

const remember = (blocks: BlockCounts, messageId: string, count: number) => {
  const index = blocks.findIndex(([id]) => id === messageId)

  if (index !== -1) blocks.splice(index, 1)

  blocks.push([messageId, count])

  if (blocks.length > BLOCK_MEMORY) blocks.shift()
}

/** Сообщение модели: блоки считаются всегда, слова - только из текстовых блоков. */
const answerOf = (conversation: string, line: CliMessage, blocks: BlockCounts) => {
  const body = recordField(line, 'message')
  const content = Array.isArray(body['content']) ? body['content'] : []
  const messageId = stringField(body, 'id')
  const base = blocks.find(([id]) => id === messageId)?.[1] ?? 0

  if (messageId) remember(blocks, messageId, base + content.length)

  // Свои строки CLI подписывает моделью в угловых скобках: оборванный ход, ошибка API.
  const uuid = stringField(line, 'uuid')

  if (!uuid || stringField(body, 'model').startsWith('<')) return null

  const offset = content.findIndex((block) => {
    const text =
      isRecord(block) && block['type'] === 'text' ? stringField(block, 'text').trim() : ''

    return text !== '' && text !== EMPTY_TEXT_PLACEHOLDER
  })

  if (offset === -1) return null

  const text = textBlocks(content)
    .filter((part) => part.trim() && part.trim() !== EMPTY_TEXT_PLACEHOLDER)
    .join('\n')
    .trim()
    .replace(BLANK_LINES, '\n\n')

  return {
    conversation,
    uuid,
    anchor: messageId ? `${messageId}:${base + offset}` : uuid,
    at: timeOf(line),
    speaker: 'claude' as const,
    text: text.slice(0, MAX_TEXT_CHARS),
  }
}

/** Сообщение человека: служебное (мета, сводка компакта, строки субагента) - не сообщение. */
const personOf = (conversation: string, line: CliMessage): IndexedMessage | null => {
  if (
    line['isMeta'] === true ||
    line['isSidechain'] === true ||
    line['isCompactSummary'] === true
  ) {
    return null
  }

  const parent = line['parent_tool_use_id']

  if (typeof parent === 'string' && parent) return null

  const words = personWords(textBlocks(recordField(line, 'message')['content']).join('\n'))
  const uuid = stringField(line, 'uuid')

  if (!words || !uuid) return null

  return {
    conversation,
    uuid,
    anchor: words.shellOnly ? `${uuid}:shell:0` : uuid,
    at: timeOf(line),
    speaker: 'you',
    text: words.text.slice(0, MAX_TEXT_CHARS),
  }
}

/**
 * Что строка транскрипта даёт поиску: слова человека или модели, имя разговора, метку
 * отката - и ничего из машинерии (результаты вызовов, размышления, вывод команд). Дешёвые
 * проверки подстрокой - раньше разбора: строк десятки тысяч, и результат вызова бывает в
 * сотню килобайт. Сообщение модели разбирается всегда - его блоки считаются ради номера.
 */
export const readTranscriptLine = (
  conversation: string,
  line: string,
  blocks: BlockCounts,
): TranscriptLine | null => {
  if (!line.startsWith('{')) return null

  const spoken = line.includes(USER)
  const answered = line.includes(ASSISTANT)

  if (spoken && !answered && line.includes(TOOL_RESULT) && !line.includes(TEXT_BLOCK)) return null
  if (!spoken && !answered && !MARKS.some((mark) => line.includes(mark))) return null

  const parsed = parseCliLine(line)

  if (!parsed) return null
  if (parsed.type === 'last-prompt' && parsed['rewound'] === true) return { kind: 'rewind' }
  if (parsed.type === 'ai-title')
    return { kind: 'aiTitle', title: stringField(parsed, 'aiTitle').trim() }
  if (parsed.type === 'custom-title') {
    return { kind: 'customTitle', title: stringField(parsed, 'customTitle').trim() }
  }

  const message =
    parsed.type === 'assistant' && parsed['isSidechain'] !== true
      ? answerOf(conversation, parsed, blocks)
      : parsed.type === 'user'
        ? personOf(conversation, parsed)
        : null

  return message ? { kind: 'message', message } : null
}
