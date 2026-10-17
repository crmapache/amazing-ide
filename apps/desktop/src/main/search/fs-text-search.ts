import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { join } from 'node:path'

import type { ProjectFileList } from '@shared/search'

import type { MatchCollector } from './match-collector'
import { walkProjectFiles } from './project-walk'
import {
  FS_CONCURRENCY,
  BINARY_SNIFF_BYTES,
  PROJECT_FILES_LIMIT,
  FALLBACK_FILE_MAX_BYTES,
} from './search.constants'
import { findMatchingLines } from './text-match'
import type { LineHit } from './text-match'

/**
 * Как открываем файл для поиска. O_NOFOLLOW - по символической ссылке текст не
 * читается вовсе, как и у git grep: notes.txt -> ~/.aws/credentials показал бы в
 * результатах чужое для проекта, а проверять, куда ведёт ссылка, - лишняя гонка
 * между проверкой и чтением. Имя ссылки в списке файлов остаётся. O_NONBLOCK -
 * чтобы FIFO, подложенный на место файла, не повесил поиск на открытии.
 */
const OPEN_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK

/** Текст файла, если в нём есть смысл искать: не ссылка, не крупный, не двоичный. */
const readSearchableText = async (absolutePath: string): Promise<string | null> => {
  try {
    const handle = await open(absolutePath, OPEN_FLAGS)

    try {
      const info = await handle.stat()

      if (!info.isFile() || info.size > FALLBACK_FILE_MAX_BYTES) return null

      const bytes = await handle.readFile()

      return bytes.subarray(0, BINARY_SNIFF_BYTES).includes(0) ? null : bytes.toString('utf8')
    } finally {
      await handle.close()
    }
  } catch {
    // Ссылка (ELOOP), удалённый посреди поиска файл, нет прав - просто без него.
    return null
  }
}

const findInFile = async (absolutePath: string, query: string): Promise<LineHit[]> => {
  const content = await readSearchableText(absolutePath)

  return content === null ? [] : findMatchingLines(content, query)
}

/**
 * Поиск по готовому списку файлов, чтением с диска пачками. Отмена и время
 * проверяются между пачками. Порядок результатов - порядок списка, как бы ни
 * разошлись чтения внутри пачки. Список обрезан - результат помечен неполным.
 */
export const searchFileList = async (
  rootPath: string,
  { paths, truncated }: ProjectFileList,
  query: string,
  collector: MatchCollector,
  signal: AbortSignal,
): Promise<void> => {
  if (truncated) collector.markIncomplete()

  for (let index = 0; index < paths.length; index += FS_CONCURRENCY) {
    if (signal.aborted) {
      collector.markIncomplete()

      return
    }

    const batch = paths.slice(index, index + FS_CONCURRENCY)
    const found = await Promise.all(batch.map((path) => findInFile(join(rootPath, path), query)))

    for (const [position, hits] of found.entries()) {
      const relativePath = batch[position] ?? ''

      for (const { line, text } of hits) {
        if (!collector.add(relativePath, line, text)) return
      }
    }
  }
}

/** Поиск в папке без git: обход без служебных и тяжёлых каталогов, затем чтение. */
export const searchFilesDirectly = async (
  rootPath: string,
  query: string,
  collector: MatchCollector,
  signal: AbortSignal,
): Promise<void> => {
  const files = await walkProjectFiles(rootPath, { limit: PROJECT_FILES_LIMIT, signal })

  await searchFileList(rootPath, files, query, collector, signal)
}
