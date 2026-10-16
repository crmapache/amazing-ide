import { GIT_DETAILS_MAX_LINES } from './git.constants'

/** Строки вывода без пустых: список веток, удалённых репозиториев. */
export const parseLines = (stdout: string): string[] =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

/** Удалённые ветки без указателей вида origin/HEAD: на них не переключаются. */
export const parseRemoteBranches = (stdout: string): string[] =>
  parseLines(stdout).filter((branch) => !branch.endsWith('/HEAD') && branch.includes('/'))

export const firstLine = (output: string): string => parseLines(output)[0] ?? ''

/** Что сказал git при неудаче: несколько первых непустых строк, без хвоста подсказок. */
export const summarizeGitError = (stderr: string): string =>
  stderr
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .slice(0, GIT_DETAILS_MAX_LINES)
    .join('\n')

/** Код выхода git из ошибки execFile. ENOENT и подобные - не код выхода. */
export const exitCodeOf = (error: unknown): number | null => {
  const code = (error as { code?: unknown } | null)?.code

  return typeof code === 'number' ? code : null
}

export const stderrOf = (error: unknown): string => {
  const stderr = (error as { stderr?: unknown } | null)?.stderr

  return typeof stderr === 'string' && stderr.length > 0 ? stderr : String(error)
}

/**
 * Имя папки для клона по адресу репозитория, как это делает сам git:
 * git@github.com:owner/repo.git и https://github.com/owner/repo/ → repo.
 */
export const repositoryName = (url: string): string | null => {
  const name = url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '')
    .split(/[/:]/)
    .pop()

  return name && name !== '.' && name !== '..' ? name : null
}

/** Имя локальной ветки для удалённой: origin/feature/x → feature/x. */
export const localNameOf = (remoteBranch: string): string =>
  remoteBranch.slice(remoteBranch.indexOf('/') + 1)
