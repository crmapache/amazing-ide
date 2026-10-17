import type { Dirent } from 'node:fs'
import { stat, readdir } from 'node:fs/promises'
import { join, posix } from 'node:path'

import type { DirectoryEntry, DirectoryEntryKind } from '@shared/fs'

import { HIDDEN_ENTRY_NAMES } from './directory-reader.constants'
import { toWindowPath, resolveInsideRoot } from './project-paths'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Папки сверху, внутри групп - по имени с учётом чисел (file2 раньше file10). */
export const sortEntries = (entries: DirectoryEntry[]): DirectoryEntry[] =>
  [...entries].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'directory' ? -1 : 1

    return collator.compare(left.name, right.name)
  })

/** У ссылки kind берётся по цели. Битая ссылка показывается файлом. */
const resolveKind = async (dirent: Dirent, absolutePath: string): Promise<DirectoryEntryKind> => {
  if (!dirent.isSymbolicLink()) return dirent.isDirectory() ? 'directory' : 'file'

  try {
    return (await stat(absolutePath)).isDirectory() ? 'directory' : 'file'
  } catch {
    return 'file'
  }
}

/**
 * Содержимое одного каталога проекта, без вложенных: дерево раскрывается по
 * одному уровню, и большой проект не читается целиком ради первой отрисовки.
 * Имена и пути - в NFC, как и у поиска (toWindowPath): иначе дерево не раскрылось
 * бы до файла, найденного поиском. Читается каталог по пути как есть: APFS находит
 * NFD-папку и по NFC-пути.
 */
export const readDirectory = async (
  rootPath: string,
  relativePath: string,
): Promise<DirectoryEntry[]> => {
  const absolute = resolveInsideRoot(rootPath, relativePath)

  if (absolute === null) {
    throw new Error(`Путь выходит за пределы проекта: ${relativePath}`)
  }

  const dirents = await readdir(absolute, { withFileTypes: true })
  const visible = dirents.filter((dirent) => !HIDDEN_ENTRY_NAMES.has(dirent.name))
  const entries = await Promise.all(
    visible.map(async (dirent) => ({
      name: toWindowPath(dirent.name),
      relativePath: toWindowPath(posix.join(relativePath, dirent.name)),
      kind: await resolveKind(dirent, join(absolute, dirent.name)),
      isSymlink: dirent.isSymbolicLink(),
    })),
  )

  return sortEntries(entries)
}
