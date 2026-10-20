import { dirname, relative, isAbsolute } from 'node:path'

import { git } from '../git/git-runner'

/**
 * Что вокруг проекта-подпапки репозитория надо слушать отдельно. gitDir - папка .git,
 * если она вне корня проекта (или папка worktree). ignoreDirs - папки от корня
 * репозитория до той, что прямо над проектом: их .gitignore тоже красят файлы проекта.
 */
export type RepoSurroundings = { gitDir: string | null; ignoreDirs: string[] }

const NONE: RepoSurroundings = { gitDir: null, ignoreDirs: [] }

const isOutside = (rootPath: string, path: string): boolean => {
  const fromRoot = relative(rootPath, path)

  return fromRoot === '..' || fromRoot.startsWith('../') || isAbsolute(fromRoot)
}

/** Папки от верха репозитория до родителя проекта, сверху вниз. Проект - корень: пусто. */
export const foldersAbove = (topLevel: string, rootPath: string): string[] => {
  const folders: string[] = []

  for (let folder = dirname(rootPath); !isOutside(topLevel, folder); folder = dirname(folder)) {
    folders.unshift(folder)

    if (folder === topLevel) break
  }

  return rootPath === topLevel ? [] : folders
}

/** Спросить git, где .git и верх репозитория. Не репозиторий или git нет - слушать нечего. */
export const readRepoSurroundings = async (rootPath: string): Promise<RepoSurroundings> => {
  try {
    const { stdout } = await git(rootPath, ['rev-parse', '--absolute-git-dir', '--show-toplevel'])
    const [gitDir = '', topLevel = ''] = stdout.split('\n')

    if (!gitDir || !topLevel) return NONE

    return {
      gitDir: isOutside(rootPath, gitDir) ? gitDir : null,
      ignoreDirs: foldersAbove(topLevel, rootPath),
    }
  } catch {
    return NONE
  }
}
