import type { CliProcess } from '../cli/cli-process'
import { rankOf, outranks } from '../tabs/tab-names'
import { titleFromReply } from './cli-replies'
import type { ConversationRuntime } from './conversation-runtime'
import {
  TITLE_MIN_CHARS,
  TITLE_SAMPLE_CHARS,
  HOUSEKEEPING_COMMANDS,
} from './conversation.constants'

/**
 * Что отдать модели, чтобы она назвала разговор, или null - по этому сообщению не назвать,
 * ждём следующего. Команда без аргументов - словами («the /code-review command»): так
 * модель читает её как предмет разговора, а не строку, которую можно вернуть как есть, и
 * короткое «/cp» проходит порог длины. Команда с аргументами уже говорит словами - едет как
 * написана.
 */
export const titleDescription = (text: string): string | null => {
  const said = text.trim()
  const command = /^\/(\S+)/.exec(said)?.[1]

  if (command !== undefined) {
    if (HOUSEKEEPING_COMMANDS.has(command)) return null
    if (said.length === command.length + 1) return `the /${command} command`
  }

  if (said.length < TITLE_MIN_CHARS) return null

  return Array.from(said).slice(0, TITLE_SAMPLE_CHARS).join('')
}

/**
 * Имя вкладки от модели - сразу после сообщения, а не по концу хода: CLI отвечает на
 * `generate_session_title` и посреди хода, за пару секунд (как в ACC), а ход бывает и в
 * час длиной. Спрашиваем, пока у вкладки нет имени от модели или человека: не вышло или
 * сообщение не годится - пробует следующее. Ответ после /clear - о прежнем разговоре,
 * имя от человека, данное, пока модель думала, модель не перебивает.
 */
export const askTitle = (runtime: ConversationRuntime, process: CliProcess, text: string) => {
  if (runtime.titleAsking || rankOf(runtime.meta.titleSource) >= rankOf('llm')) return

  const description = titleDescription(text)

  if (!description) return

  const epoch = runtime.titleEpoch

  runtime.titleAsking = true
  process
    .control({ subtype: 'generate_session_title', description, persist: true })
    .then((reply) => {
      const title = titleFromReply(reply)

      if (title && epoch === runtime.titleEpoch && outranks('llm', runtime.meta.titleSource)) {
        runtime.update({ title, titleSource: 'llm' })
      }
    })
    .catch(() => undefined)
    .finally(() => {
      runtime.titleAsking = false
    })
}

/**
 * /clear начал новый разговор: имя модели было о прежнем - следующее сообщение назовёт
 * вкладку заново (имя держится, пока нового нет). Имя от человека остаётся его.
 */
export const forgetTitle = (runtime: ConversationRuntime) => {
  runtime.titleEpoch += 1
  runtime.titleAsking = false

  if (runtime.meta.titleSource === 'llm') runtime.update({ titleSource: 'heuristic' })
}
