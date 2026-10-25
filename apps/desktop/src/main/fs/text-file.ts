import { constants } from 'node:fs'
import { open, access, realpath } from 'node:fs/promises'

import type { FileRead, FileVersion } from '@shared/fs'

import { MISSING_CODES, BINARY_SNIFF_BYTES, TEXT_FILE_MAX_BYTES } from './text-file.constants'
import {
  hashText,
  errorCode,
  failureOf,
  versionOf,
  decodeText,
  insideRoot,
  isTextStart,
  outsideFile,
  relativeInside,
} from './text-file.utils'

const MISSING: FileRead = { kind: 'missing' }

/**
 * Где на самом деле лежит файл: вне проекта (ссылка ведёт за корень) или внутри, но по
 * другому пути (ссылка внутри проекта) - его и назовёт слежение за диском.
 */
const locateReal = async (rootPath: string, absolute: string, relativePath: string) => {
  const [realRoot, realFile] = await Promise.all([realpath(rootPath), realpath(absolute)])
  const realRelative = relativeInside(realRoot, realFile)

  return {
    outside: realRelative === null,
    realPath: realRelative !== null && realRelative !== relativePath ? realRelative : null,
  }
}

/** Где на самом деле лежит прочитанный файл - спрашивается только у текста. */
type Place = { outside: boolean; realPath: string | null }

/** Файл вне проекта сам по себе и есть место: настоящий путь окну не нужен. */
const OUTSIDE: Place = { outside: true, realPath: null }

/**
 * Файл для редактора. Версия и байты берутся из одного открытого файла: иначе правка между
 * ними дала бы версию от одного содержимого и текст от другого. Открытие - без ожидания
 * (O_NONBLOCK): канал FIFO иначе навсегда занял бы поток главного процесса. known - версия,
 * которую окно уже держит: совпала - текст не читается. label - путь для журнала.
 */
const readAt = async (
  absolute: string,
  label: string,
  known: FileVersion | null,
  place: () => Promise<Place>,
): Promise<FileRead> => {
  let handle

  try {
    handle = await open(absolute, constants.O_RDONLY | constants.O_NONBLOCK)
  } catch (error) {
    return MISSING_CODES.has(errorCode(error))
      ? MISSING
      : { kind: 'failed', reason: failureOf(error, label) }
  }

  try {
    const info = await handle.stat({ bigint: true })

    if (info.isDirectory()) return MISSING
    if (!info.isFile()) return { kind: 'failed', reason: 'unknown' }
    if (known !== null && versionOf(info) === known) return { kind: 'unchanged' }

    if (info.size > TEXT_FILE_MAX_BYTES) {
      return { kind: 'tooLarge', size: Number(info.size), limit: TEXT_FILE_MAX_BYTES }
    }

    const decoded = decodeText(await handle.readFile())

    if (!decoded) return { kind: 'binary' }

    const [readOnly, where] = await Promise.all([
      access(absolute, constants.W_OK).then(
        () => false,
        () => true,
      ),
      place(),
    ])

    return {
      kind: 'text',
      ...decoded,
      version: versionOf(info),
      readOnly,
      ...where,
      hash: hashText(decoded.text),
    }
  } catch (error) {
    return { kind: 'failed', reason: failureOf(error, label) }
  } finally {
    await handle.close()
  }
}

/** Файл проекта для редактора: путь от корня, за корень - ошибка. */
export const readTextFile = async (
  rootPath: string,
  relativePath: string,
  known: FileVersion | null = null,
): Promise<FileRead> => {
  const absolute = insideRoot(rootPath, relativePath)

  return readAt(absolute, relativePath, known, () => locateReal(rootPath, absolute, relativePath))
}

/**
 * Файл вне проекта для редактора - его открыли ссылкой (лента Claude Code). Те же проверки
 * и потолки, что у файла проекта; путь проверяется заново, негодный - ошибка. Текст всегда
 * помечен outside: сам он не сохраняется, только по просьбе человека.
 */
export const readOutsideTextFile = async (
  path: string,
  known: FileVersion | null = null,
): Promise<FileRead> => readAt(outsideFile(path), path, known, () => Promise.resolve(OUTSIDE))

/**
 * Откроет ли его редактор: обычный файл не больше потолка, и его начало - текст UTF-8 без
 * нулей (обрезанная на краю буква - не повод). Картинку, PDF и архив по ссылке честнее
 * отдать их программе, чем показать «не текст». Без ожидания - как чтение.
 */
export const opensAsText = async (absolute: string): Promise<boolean> => {
  const handle = await open(absolute, constants.O_RDONLY | constants.O_NONBLOCK).catch(() => null)

  if (!handle) return false

  try {
    const info = await handle.stat()

    if (!info.isFile() || info.size > TEXT_FILE_MAX_BYTES) return false

    const head = Buffer.alloc(Math.min(info.size, BINARY_SNIFF_BYTES))
    const { bytesRead } = await handle.read(head, 0, head.length, 0)

    return isTextStart(head.subarray(0, bytesRead))
  } catch {
    return false
  } finally {
    await handle.close()
  }
}
