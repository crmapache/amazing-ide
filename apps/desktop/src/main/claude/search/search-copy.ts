import { rm, mkdir, rename, readFile, writeFile, appendFile } from 'node:fs/promises'
import { join } from 'node:path'

import { isRecord, stringField } from '../cli/cli-messages'
import { COPY_FORMAT, MANIFEST_FILE } from './search.constants'
import type { IndexedMessage } from './search.types'
import type { BlockCounts } from './transcript-text'

/** Что было известно о транскрипте, когда из него брали слова: размер, время, докуда прочитан. */
export type Seen = { size: number; modified: number; offset: number }

/** Запись манифеста о разговоре: докуда копия на диске догнала транскрипт и его имена. */
export type ManifestEntry = {
  seen: Seen
  aiTitle: string | null
  customTitle: string | null
  firstText: string
  blocks: BlockCounts
}

/** Ничего не прочитано: файл читается с начала. */
export const SEEN_ZERO: Seen = { size: 0, modified: 0, offset: 0 }

const numberOr0 = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const writeAtomically = async (file: string, text: string) => {
  const temporary = `${file}.tmp`

  await writeFile(temporary, text, 'utf8')
  await rename(temporary, file)
}

const entryOf = (value: unknown): ManifestEntry | null => {
  if (!isRecord(value)) return null

  const blocks = Array.isArray(value['blocks'])
    ? value['blocks'].filter(
        (item): item is [string, number] =>
          Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'number',
      )
    : []

  return {
    seen: {
      size: numberOr0(value['size']),
      modified: numberOr0(value['modified']),
      offset: numberOr0(value['offset']),
    },
    aiTitle: stringField(value, 'aiTitle') || null,
    customTitle: stringField(value, 'customTitle') || null,
    firstText: stringField(value, 'firstText'),
    blocks,
  }
}

/**
 * Манифест копии: по разговору - докуда копия догнала транскрипт. Нет, не читается, другой
 * формы - null: копия - кэш, она перестроится из транскриптов молча.
 */
export const readManifest = async (dir: string): Promise<Map<string, ManifestEntry> | null> => {
  try {
    const root: unknown = JSON.parse(await readFile(join(dir, MANIFEST_FILE), 'utf8'))

    if (!isRecord(root) || root['format'] !== COPY_FORMAT || !isRecord(root['files'])) return null

    const entries = new Map<string, ManifestEntry>()

    for (const [id, value] of Object.entries(root['files'])) {
      const entry = entryOf(value)

      if (entry) entries.set(id, entry)
    }

    return entries
  } catch {
    return null
  }
}

export const writeManifest = async (dir: string, entries: ReadonlyMap<string, ManifestEntry>) => {
  const files = Object.fromEntries(
    [...entries].map(([id, entry]) => [
      id,
      {
        ...entry.seen,
        ...(entry.aiTitle ? { aiTitle: entry.aiTitle } : {}),
        ...(entry.customTitle ? { customTitle: entry.customTitle } : {}),
        ...(entry.firstText ? { firstText: entry.firstText } : {}),
        blocks: entry.blocks,
      },
    ]),
  )

  await mkdir(dir, { recursive: true })
  await writeAtomically(join(dir, MANIFEST_FILE), JSON.stringify({ format: COPY_FORMAT, files }))
}

const copyFile = (dir: string, id: string) => join(dir, `${id}.jsonl`)

const encode = (message: IndexedMessage) =>
  `${JSON.stringify({ u: message.uuid, a: message.anchor, t: message.at, s: message.speaker, x: message.text })}\n`

const decode = (conversation: string, line: string): IndexedMessage | null => {
  try {
    const value: unknown = JSON.parse(line)

    if (!isRecord(value)) return null

    const speaker = value['s']
    const uuid = stringField(value, 'u')
    const text = stringField(value, 'x')

    if (!uuid || !text || (speaker !== 'you' && speaker !== 'claude')) return null

    return {
      conversation,
      uuid,
      anchor: stringField(value, 'a') || uuid,
      at: numberOr0(value['t']),
      speaker,
      text,
    }
  } catch {
    return null
  }
}

/** Слова разговора из копии; файла нет или он не читается - null. */
export const readCopy = async (dir: string, id: string): Promise<IndexedMessage[] | null> => {
  try {
    const text = await readFile(copyFile(dir, id), 'utf8')

    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => decode(id, line))
      .filter((message) => message !== null)
  } catch {
    return null
  }
}

/** Копия разговора целиком - после чтения с начала, отката или провалившейся записи. */
export const writeCopy = async (dir: string, id: string, messages: readonly IndexedMessage[]) => {
  await mkdir(dir, { recursive: true })
  await writeAtomically(copyFile(dir, id), messages.map(encode).join(''))
}

/** Только то, что дописалось: копия - голова того же списка. */
export const appendCopy = async (dir: string, id: string, messages: readonly IndexedMessage[]) => {
  if (messages.length > 0)
    await appendFile(copyFile(dir, id), messages.map(encode).join(''), 'utf8')
}

export const removeCopy = (dir: string, id: string) => rm(copyFile(dir, id), { force: true })
