import { constants } from 'node:fs'
import { open, access, realpath } from 'node:fs/promises'

import type { FileRead, FileVersion } from '@shared/fs'

import { MISSING_CODES, TEXT_FILE_MAX_BYTES } from './text-file.constants'
import {
  hashText,
  errorCode,
  failureOf,
  versionOf,
  decodeText,
  insideRoot,
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

/**
 * Файл проекта для редактора. Версия и байты берутся из одного открытого файла: иначе
 * правка между ними дала бы версию от одного содержимого и текст от другого. Открытие -
 * без ожидания (O_NONBLOCK): канал FIFO в проекте иначе навсегда занял бы поток главного
 * процесса. known - версия, которую окно уже держит: совпала - текст не читается.
 */
export const readTextFile = async (
  rootPath: string,
  relativePath: string,
  known: FileVersion | null = null,
): Promise<FileRead> => {
  const absolute = insideRoot(rootPath, relativePath)
  let handle

  try {
    handle = await open(absolute, constants.O_RDONLY | constants.O_NONBLOCK)
  } catch (error) {
    return MISSING_CODES.has(errorCode(error))
      ? MISSING
      : { kind: 'failed', reason: failureOf(error, relativePath) }
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

    const [readOnly, place] = await Promise.all([
      access(absolute, constants.W_OK).then(
        () => false,
        () => true,
      ),
      locateReal(rootPath, absolute, relativePath),
    ])

    return {
      kind: 'text',
      ...decoded,
      version: versionOf(info),
      readOnly,
      ...place,
      hash: hashText(decoded.text),
    }
  } catch (error) {
    return { kind: 'failed', reason: failureOf(error, relativePath) }
  } finally {
    await handle.close()
  }
}
