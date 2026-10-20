import { rm, stat, mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { SESSIONS_FILE } from './search.constants'
import type { IndexedMessage } from './search.types'

/** Разговор для корпуса: имя, слова и номер правки - корпус переписывает только изменённое. */
export type CorpusConversation = {
  id: string
  title: string
  messages: readonly IndexedMessage[]
  revision: number
}

/** Разговор текстом: у каждого сообщения строка-заголовок `## <uuid> <время> <you|claude>`. */
export const corpusText = (conversation: CorpusConversation): string => {
  const parts = [`# ${conversation.title || 'untitled'}\n# conversation ${conversation.id}\n`]

  for (const message of conversation.messages) {
    const at = message.at > 0 ? new Date(message.at).toISOString() : '-'

    parts.push(`\n## ${message.uuid} ${at} ${message.speaker}\n${message.text}\n`)
  }

  return parts.join('')
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Время списка разговоров - местное, как его помнит человек: «2026-10-19 14:05». */
const localTime = (at: number) => {
  if (at <= 0) return '-'

  const date = new Date(at)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Список разговоров, свежие первыми: id | первое .. последнее сообщение | сколько | имя. */
export const sessionsText = (conversations: readonly CorpusConversation[]): string => {
  const lines = [
    '# One line per conversation: id | first message .. last message | messages | title\n',
    '# Every conversation is in <id>.txt; there each message starts with a header line: ## <uuid> <time> <you|claude>\n',
  ]
  const spoken = conversations
    .filter((conversation) => conversation.messages.length > 0)
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))

  for (const conversation of spoken) {
    const first = localTime(conversation.messages[0]?.at ?? 0)
    const last = localTime(conversation.messages.at(-1)?.at ?? 0)
    const title = (conversation.title || 'untitled').replace(/\n/g, ' ')

    lines.push(
      `${conversation.id} | ${first} .. ${last} | ${conversation.messages.length} | ${title}\n`,
    )
  }

  return lines.join('')
}

/**
 * Разговоры текстом для модели: по файлу на разговор и список. Модель ищет по ним, а не по
 * транскриптам - там строки JSON по мегабайту, и один grep съел бы её контекст. Пишется
 * только изменённое с прошлого раза (written - номера записанных правок), разговоры,
 * которых больше нет, уходят из папки: находку в них не открыть.
 */
export const writeCorpus = async (
  folder: string,
  conversations: readonly CorpusConversation[],
  written: Map<string, number>,
): Promise<void> => {
  await mkdir(folder, { recursive: true })

  const wanted = new Set([SESSIONS_FILE])

  for (const conversation of conversations) {
    const name = `${conversation.id}.txt`
    const file = join(folder, name)

    wanted.add(name)

    const exists = await stat(file).then(
      () => true,
      () => false,
    )

    if (exists && written.get(conversation.id) === conversation.revision) continue

    await writeFile(file, corpusText(conversation), 'utf8')
    written.set(conversation.id, conversation.revision)
  }

  await writeFile(join(folder, SESSIONS_FILE), sessionsText(conversations), 'utf8')

  for (const name of await readdir(folder)) {
    if (!wanted.has(name)) await rm(join(folder, name), { force: true, recursive: true })
  }

  for (const id of [...written.keys()]) if (!wanted.has(`${id}.txt`)) written.delete(id)
}
