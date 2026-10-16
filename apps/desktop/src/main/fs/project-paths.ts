import { sep, resolve, relative, isAbsolute } from 'node:path'

/**
 * Абсолютный путь к элементу проекта или null, если путь выходит за корень.
 *
 * Окно присылает путь от корня проекта, и главный процесс не верит ему на слово:
 * `../..` или абсолютный путь вывели бы чтение за пределы открытой папки.
 * Проверка лексическая - по строке пути, без обращения к диску.
 */
export const resolveInsideRoot = (rootPath: string, relativePath: string): string | null => {
  const absolute = resolve(rootPath, relativePath)
  const fromRoot = relative(rootPath, absolute)

  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    return null
  }

  return absolute
}
