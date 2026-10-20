import { FOLDER_SCORE_WEIGHT } from './file-match.constants'
import type { FileMatch, PreparedFile } from './file-match.types'
import type { FuzzyMatch } from './fuzzy-match.types'
import { fuzzyMatch } from './fuzzy-match.utils'
import { splitPath } from './path.utils'

/**
 * Запрос для сравнения имён: нижний регистр, NFC (буква «й» с клавиатуры и из имени
 * файла - один символ) и без пробелов. Пробел разделяет слова, как в WebStorm:
 * «tree node» находит FileTreeNode, а не требует пробела в имени.
 */
export const toNeedle = (query: string) => query.normalize('NFC').toLowerCase().replace(/\s+/g, '')

/** Разбор списка файлов один раз на открытие поиска, а не на каждую букву запроса. */
export const prepareFiles = (paths: readonly string[]): PreparedFile[] =>
  paths.map((path) => {
    const { name, folder } = splitPath(path)

    return { path, name, folder, pathLower: path.toLowerCase(), nameLower: name.toLowerCase() }
  })

const compareResults = (left: FileMatch, right: FileMatch) =>
  right.match.score - left.match.score ||
  left.file.path.length - right.file.path.length ||
  left.file.path.localeCompare(right.file.path)

/**
 * Совпадение файла с запросом. Запрос со «/» делится по последнему слешу: начало
 * ищется в папке, хвост - в имени (`tree/node` найдёт `file-tree/FileTreeNode.tsx`).
 * Подсвечивается только имя - папка в списке идёт серым пояснением.
 */
const matchFile = (file: PreparedFile, needle: string): FuzzyMatch | null => {
  const slash = needle.lastIndexOf('/')

  if (slash < 0) return fuzzyMatch(needle, file.name, file.nameLower)

  const byName = fuzzyMatch(needle.slice(slash + 1), file.name, file.nameLower)
  const folderLower = file.pathLower.slice(0, file.pathLower.length - file.nameLower.length)
  const byFolder = byName && fuzzyMatch(needle.slice(0, slash), file.folder, folderLower)

  if (!byName || !byFolder) return null

  return { score: byName.score + byFolder.score * FOLDER_SCORE_WEIGHT, ranges: byName.ranges }
}

/**
 * Файлы под запрос, лучшие сверху. Без «/» ищется только по имени файла, как в
 * WebStorm. Пустой запрос - ничего: весь проект списком не нужен никому.
 */
export const rankFiles = (files: readonly PreparedFile[], query: string, limit: number) => {
  const needle = toNeedle(query)

  if (needle === '') return []

  const results: FileMatch[] = []

  for (const file of files) {
    const match = matchFile(file, needle)

    if (match) results.push({ file, match })
  }

  return results.sort(compareResults).slice(0, limit)
}
