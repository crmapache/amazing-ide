import type { DirectoryEntry } from '@shared/fs'

/** Папки, которые надо раскрыть, чтобы увидеть путь: «a/b/c.ts» - «a» и «a/b». */
export const ancestorPaths = (relativePath: string): string[] => {
  const parts = relativePath.split('/').slice(0, -1)

  return parts.map((_, index) => parts.slice(0, index + 1).join('/'))
}

/** Путь - один из списка или лежит внутри одного из них: «a/b» внутри «a», «ab» - нет. */
export const isInsideAny = (path: string, roots: readonly string[]): boolean =>
  roots.some((root) => path === root || path.startsWith(`${root}/`))

/**
 * Папки-ссылки среди прочитанных списков. Дерево показывает внутри них цель ссылки, а
 * macOS сообщает об изменениях по настоящему пути цели - сами они о себе не узнают.
 */
export const symlinkedFolders = (listings: readonly (DirectoryEntry[] | undefined)[]): string[] =>
  listings.flatMap(
    (entries) =>
      entries
        ?.filter(({ kind, isSymlink }) => isSymlink && kind === 'directory')
        .map(({ relativePath }) => relativePath) ?? [],
  )
