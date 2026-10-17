import type { Dirent } from 'node:fs'
import { stat, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { ProjectFileList } from '@shared/search'

import { FS_CONCURRENCY, SKIPPED_FILE_NAMES, SKIPPED_DIRECTORY_NAMES } from './search.constants'

type WalkOptions = { limit: number; signal?: AbortSignal }

/** Обычный файл (или ссылка на него). Каталог, сокет, битая ссылка - нет. */
export const isRegularFile = async (absolutePath: string): Promise<boolean> => {
  try {
    return (await stat(absolutePath)).isFile()
  } catch {
    return false
  }
}

const readListing = async (rootPath: string, relativeDir: string): Promise<Dirent[]> => {
  try {
    return await readdir(join(rootPath, relativeDir), { withFileTypes: true })
  } catch {
    // Нет прав или каталог исчез посреди обхода - просто без него.
    return []
  }
}

/**
 * Только обычные файлы: FIFO или сокет при чтении в поиске повесил бы его навсегда.
 * Ссылка на каталог не раскрывается - так обход не уйдёт в цикл (ссылка на корень)
 * и не выйдет за пределы проекта.
 */
const fileKindOf = async (dirent: Dirent, absolutePath: string) => {
  if (dirent.isDirectory()) return SKIPPED_DIRECTORY_NAMES.has(dirent.name) ? null : 'directory'
  if (SKIPPED_FILE_NAMES.has(dirent.name)) return null
  if (dirent.isFile()) return 'file'
  if (dirent.isSymbolicLink() && (await isRegularFile(absolutePath))) return 'file'

  return null
}

/**
 * Файлы папки без git: обход в ширину пачками каталогов, без служебных и тяжёлых
 * (search.constants.ts). Пути от корня через «/». Больше предела или отмена -
 * обрезанный список с truncated.
 */
export const walkProjectFiles = async (
  rootPath: string,
  { limit, signal }: WalkOptions,
): Promise<ProjectFileList> => {
  const paths: string[] = []
  const queue: string[] = ['']

  while (queue.length > 0) {
    if (signal?.aborted) return { paths, truncated: true }

    const batch = queue.splice(0, FS_CONCURRENCY)
    const listings = await Promise.all(batch.map((dir) => readListing(rootPath, dir)))

    for (const [index, dirents] of listings.entries()) {
      const dir = batch[index] ?? ''

      for (const dirent of dirents) {
        const relativePath = dir === '' ? dirent.name : `${dir}/${dirent.name}`
        const kind = await fileKindOf(dirent, join(rootPath, relativePath))

        if (kind === 'directory') queue.push(relativePath)
        if (kind === 'file') paths.push(relativePath)
        if (paths.length > limit) return { paths: paths.slice(0, limit), truncated: true }
      }
    }
  }

  return { paths, truncated: false }
}

/**
 * Пути, которые на диске - обычные файлы, в исходном порядке, не больше max.
 * Проверка пачками: путей бывают тысячи, а stat по одному - это секунды.
 */
export const keepRegularFiles = async (
  rootPath: string,
  paths: string[],
  max: number,
): Promise<string[]> => {
  const kept: string[] = []

  for (let index = 0; index < paths.length && kept.length < max; index += FS_CONCURRENCY) {
    const batch = paths.slice(index, index + FS_CONCURRENCY)
    const checks = await Promise.all(batch.map((path) => isRegularFile(join(rootPath, path))))

    kept.push(...batch.filter((_path, position) => checks[position]))
  }

  return kept.slice(0, max)
}
