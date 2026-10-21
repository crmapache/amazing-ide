import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import type { BigIntStats } from 'node:fs'
import { rm, open, stat, rename, readFile, realpath } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'

import type { TextHash, FileWrite, FileVersion } from '@shared/fs'

import { MISSING_CODES, PERMISSION_BITS } from './text-file.constants'
import {
  hashText,
  errorCode,
  failureOf,
  versionOf,
  decodeText,
  encodeText,
  insideRoot,
  relativeInside,
} from './text-file.utils'

const MISSING: FileWrite = { kind: 'missing' }

type WriteRequest = {
  text: string
  bom: boolean
  expected: FileVersion | null
  base?: TextHash | null
  outside?: boolean
}

/** Записи, которые ещё идут: выход из IDE ждёт их, иначе файл остался бы недописанным. */
const pending = new Set<Promise<unknown>>()

/** Сведения о файле; нет такого - null, другой сбой - ошибка. */
const statOrNull = (path: string): Promise<BigIntStats | null> =>
  stat(path, { bigint: true }).catch((error: unknown) => {
    if (MISSING_CODES.has(errorCode(error))) return null

    throw error
  })

/**
 * Поверх старого файла на месте: тот же файл, только когда переименование сломало бы
 * его - жёсткие ссылки, чужой владелец, нет прав на папку. Сначала байты, потом обрезка
 * по длине: читающий посреди записи не увидит пустой файл.
 */
const writeInPlace = async (target: string, bytes: Buffer): Promise<FileVersion> => {
  const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_NONBLOCK)

  try {
    await handle.write(bytes, 0, bytes.length, 0)
    await handle.truncate(bytes.length)
    await handle.sync()

    return versionOf(await handle.stat({ bigint: true }))
  } finally {
    await handle.close()
  }
}

/**
 * Безопасная запись, как в WebStorm: новый текст - во временный файл рядом, с правами
 * старого, и переименованием на его место. Читающий видит либо старый файл целиком, либо
 * новый, а обрыв посреди записи не оставит полфайла. Версия - с самого записанного
 * файла, а не новым обращением по пути: чужая запись в ту же миллисекунду не выдаст себя
 * за нашу.
 */
const writeSafely = async (
  target: string,
  bytes: Buffer,
  previous: BigIntStats | null,
): Promise<FileVersion> => {
  const temporary = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`)
  const handle = await open(temporary, 'wx')

  try {
    await handle.write(bytes, 0, bytes.length, 0)
    if (previous) await handle.chmod(Number(previous.mode) & PERMISSION_BITS)
    await handle.sync()
    await rename(temporary, target)

    return versionOf(await handle.stat({ bigint: true }))
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  } finally {
    await handle.close()
  }
}

const saveBytes = async (target: string, bytes: Buffer, previous: BigIntStats | null) => {
  const ownFile =
    !previous || (previous.nlink === 1n && Number(previous.uid) === process.getuid?.())

  if (!ownFile) return writeInPlace(target, bytes)

  return writeSafely(target, bytes, previous).catch((error: unknown) => {
    // Папка без права записи: временный файл не создать - пишем на место.
    if (MISSING_CODES.has(errorCode(error))) throw error

    return writeInPlace(target, bytes)
  })
}

/**
 * На диске уже не та версия, от которой правили. Не конфликт, если на диске тот же текст,
 * что пишем, - файл записали тем же самым (тогда писать незачем), или тот, от которого
 * правили (base), - файл только тронули: touch, git stash и pop, lint-staged.
 */
const checkExpected = async (
  target: string,
  current: BigIntStats | null,
  { text, expected, base }: { text: string; expected: FileVersion; base: TextHash | null },
): Promise<FileWrite | 'write' | null> => {
  if (!current) return MISSING
  if (versionOf(current) === expected) return null

  const onDisk = decodeText((await readFile(target).catch(() => null)) ?? Buffer.alloc(0))

  if (onDisk?.text === text) {
    return { kind: 'saved', version: versionOf(current), hash: hashText(text) }
  }

  return base !== null && onDisk && hashText(onDisk.text) === base ? 'write' : { kind: 'conflict' }
}

const write = async (
  rootPath: string,
  relativePath: string,
  { text, bom, expected, base = null, outside = false }: WriteRequest,
): Promise<FileWrite> => {
  const absolute = insideRoot(rootPath, relativePath)
  const bytes = encodeText(text, bom)

  try {
    const current = await statOrNull(absolute)

    if (current && !current.isFile()) return MISSING

    // Пишется настоящий файл: ссылка остаётся ссылкой. Ведёт она за проект - только по
    // явной просьбе человека (⌘S), автосохранение туда не ходит.
    const target = current ? await realpath(absolute) : absolute
    const realRoot = await realpath(rootPath)

    if (!outside && relativeInside(realRoot, target) === null) {
      return { kind: 'failed', reason: 'outside' }
    }

    const verdict =
      expected === null ? null : await checkExpected(target, current, { text, expected, base })

    if (verdict && verdict !== 'write') return verdict

    return { kind: 'saved', version: await saveBytes(target, bytes, current), hash: hashText(text) }
  } catch (error) {
    if (MISSING_CODES.has(errorCode(error))) return MISSING

    return { kind: 'failed', reason: failureOf(error, relativePath) }
  }
}

/**
 * Записать текст файла проекта. С expected файл, который за это время поменял кто-то ещё,
 * не трогается (conflict); без него - пишется поверх (человек выбрал «оставить моё»).
 */
export const writeTextFile = (
  rootPath: string,
  relativePath: string,
  request: WriteRequest,
): Promise<FileWrite> => {
  const job = write(rootPath, relativePath, request)

  const settle = () => void pending.delete(job)

  pending.add(job)
  // Отказ (путь за корень) уходит тому, кто позвал; учёт записей его не теряет и не ловит.
  job.then(settle, settle)

  return job
}

/** Дождаться записей, которые ещё идут: перед выходом из IDE. */
export const settleWrites = async (): Promise<void> => {
  await Promise.allSettled([...pending])
}
