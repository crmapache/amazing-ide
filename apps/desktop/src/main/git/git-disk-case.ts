import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { GitChange, GitChangeKind } from '@shared/git'

import { toWindowPath } from '../fs/project-paths'

/** Виды строк, у которых файл есть на диске: новые и так названы с диска, удалённых нет. */
const ON_DISK: ReadonlySet<GitChangeKind> = new Set(['modified', 'added', 'renamed', 'conflict'])

/**
 * Пути списка изменений - в регистре диска, когда репозиторий регистр не различает
 * (core.ignorecase, обычное дело на macOS). git называет файл, как он записан в индексе, а
 * переименованный только регистром прямо на диске (Finder, mv) там лежит уже иначе: без
 * приведения у разницы и вкладки файла были бы два документа одного файла. Каждая папка
 * читается один раз; не нашлось на диске - путь остаётся, как его назвал git.
 */
export const withDiskCase = async (
  rootPath: string,
  files: readonly GitChange[],
): Promise<GitChange[]> => {
  const listings = new Map<string, Promise<string[]>>()

  const namesIn = (folder: string) => {
    const known = listings.get(folder)

    if (known) return known

    const names = readdir(join(rootPath, folder)).then(
      (entries) => entries.map(toWindowPath),
      () => [],
    )

    listings.set(folder, names)

    return names
  }

  const onDisk = async (path: string): Promise<string> => {
    let resolved = ''

    for (const segment of path.split('/')) {
      const names = await namesIn(resolved)
      const name =
        names.find((candidate) => candidate === segment) ??
        names.find((candidate) => candidate.toLowerCase() === segment.toLowerCase())

      if (name === undefined) return path

      resolved = resolved === '' ? name : `${resolved}/${name}`
    }

    return resolved
  }

  return Promise.all(
    files.map(async (change) =>
      ON_DISK.has(change.kind) ? { ...change, path: await onDisk(change.path) } : change,
    ),
  )
}
