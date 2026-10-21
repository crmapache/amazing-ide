import type { GitStatus, GitChanges } from '@shared/git'

import { isGitScope } from '../search/git-scope'
import { RecordReader } from '../search/record-reader'
import { GitChangesParser } from './git-changes-output'
import { withDiskCase } from './git-disk-case'
import { git } from './git-runner'
import { GitStatusParser } from './git-status-output'
import type { GitScope } from './git-status-output'
import { streamGit } from './git-stream'
import {
  GIT_STATUS_ENV,
  GIT_CHANGES_LIMIT,
  GIT_STATUS_TIMEOUT_MS,
  GIT_STATUS_ENTRIES_LIMIT,
} from './git.constants'

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

/** Для списка изменений: каждый новый файл отдельно, игнорируемых не нужно вовсе. */
const CHANGES_ARGS = ['status', '--porcelain=v2', '-z', '--untracked-files=all', '--', '.']

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

/** Разбор записей status: дерево и список изменений читают один и тот же вывод по-своему. */
type StatusRecords<T> = {
  push: (record: string) => boolean
  markTruncated: () => void
  result: () => T
}

/** git status с разбором на лету; null - git не запустился или упал. */
const readStatusRecords = async <T>(
  rootPath: string,
  args: string[],
  parser: StatusRecords<T>,
): Promise<T | null> => {
  try {
    const reader = new RecordReader([0])
    const outcome = await streamGit(rootPath, args, {
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

/**
 * Статусы файлов проекта по git для дерева; scope - от readGitScope. null - git не
 * запустился или упал.
 */
export const readGitStatus = (rootPath: string, scope: GitScope): Promise<GitStatus | null> =>
  readStatusRecords(rootPath, STATUS_ARGS, new GitStatusParser(scope, GIT_STATUS_ENTRIES_LIMIT))

/**
 * Изменённые файлы проекта для списка изменений; scope - от readGitScope. Отдельный
 * вызов git, а не тот же, что у дерева: дереву новые папки нужны целиком, одной
 * записью, а списку - каждый файл в них. Без различия регистра пути - в регистре диска. git не запустился или упал - failed: окно
 * скажет, что git не ответил, а не что папка не в git.
 */
export const readGitChanges = async (rootPath: string, scope: GitScope): Promise<GitChanges> => {
  const changes = await readStatusRecords(
    rootPath,
    CHANGES_ARGS,
    new GitChangesParser(scope, GIT_CHANGES_LIMIT),
  )

  if (!changes) return { kind: 'failed' }

  return scope.ignoreCase
    ? { ...changes, files: await withDiskCase(rootPath, changes.files) }
    : changes
}
