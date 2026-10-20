import type { GitStatus } from '@shared/git'

import { isGitScope } from '../search/git-scope'
import { RecordReader } from '../search/record-reader'
import { git } from './git-runner'
import { GitStatusParser } from './git-status-output'
import type { GitScope } from './git-status-output'
import { streamGit } from './git-stream'
import { GIT_STATUS_ENV, GIT_STATUS_TIMEOUT_MS, GIT_STATUS_ENTRIES_LIMIT } from './git.constants'

/**
 * Игнорируемые - только те, что совпали с правилом (`--ignored=matching`): папка
 * node_modules приходит одной записью, внутрь git не ходит. Новые - папками, а не
 * каждым файлом. `-- .` - только папка проекта, если она - часть большего репозитория.
 */
const STATUS_ARGS = [
  'status',
  '--porcelain=v2',
  '-z',
  '--ignored=matching',
  '--untracked-files=normal',
  '--',
  '.',
]

/** Различает ли репозиторий регистр имён: core.ignorecase, git init на macOS ставит true. */
const readIgnoreCase = async (rootPath: string): Promise<boolean> => {
  try {
    const { stdout } = await git(rootPath, ['config', '--bool', 'core.ignorecase'])

    return stdout.trim() === 'true'
  } catch {
    // Настройки нет - git различает регистр.
    return false
  }
}

/**
 * Где папка проекта внутри репозитория и различает ли он регистр. null - папка не в git
 * или вся игнорируется (тогда цвета были бы ложью) или git недоступен.
 */
export const readGitScope = async (rootPath: string): Promise<GitScope | null> => {
  try {
    if (!(await isGitScope(rootPath))) return null

    const [{ stdout }, ignoreCase] = await Promise.all([
      git(rootPath, ['rev-parse', '--show-prefix']),
      readIgnoreCase(rootPath),
    ])

    // Только перевод строки: пробел в конце имени папки - часть имени.
    return { prefix: stdout.replace(/\n$/, ''), ignoreCase }
  } catch (error) {
    console.warn('[git] не понять, в репозитории ли проект:', error)

    return null
  }
}

/**
 * Статусы файлов проекта по git для дерева; scope - от readGitScope. null - git не
 * запустился или упал.
 */
export const readGitStatus = async (
  rootPath: string,
  scope: GitScope,
): Promise<GitStatus | null> => {
  try {
    const parser = new GitStatusParser(scope, GIT_STATUS_ENTRIES_LIMIT)
    const reader = new RecordReader([0])
    const outcome = await streamGit(rootPath, STATUS_ARGS, {
      signal: AbortSignal.timeout(GIT_STATUS_TIMEOUT_MS),
      env: GIT_STATUS_ENV,
      onData: (chunk) =>
        reader.push(chunk).every(({ fields: [record = ''] }) => parser.push(record)),
    })

    if (outcome.kind === 'stopped') {
      parser.markTruncated()

      return parser.result()
    }

    if (outcome.exitCode === 0) return parser.result()

    console.warn(`[git] status завершился с кодом ${outcome.exitCode}:`, outcome.stderr)
  } catch (error) {
    console.warn('[git] status не прочитался:', error)
  }

  return null
}
