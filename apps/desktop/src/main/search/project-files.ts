import type { ProjectFileList } from '@shared/search'

import { toWindowPath } from '../fs/project-paths'
import { streamGit } from '../git/git-stream'
import { isGitScope } from './git-scope'
import { parseTrackedEntry, parseUntrackedEntry } from './git-search-output'
import type { GitPathEntry } from './git-search-output'
import { keepRegularFiles, walkProjectFiles } from './project-walk'
import { RecordReader } from './record-reader'
import {
  LS_FILES_DELIMITERS,
  PROJECT_FILES_LIMIT,
  PROJECT_FILES_TIMEOUT_MS,
} from './search.constants'

/** Отслеживаемые: с режимом (подмодуль, ссылка) и пометкой удалённых с диска. */
const TRACKED_ARGS = ['ls-files', '-z', '-t', '-s', '--cached', '--deleted']

/** Неотслеживаемые, кроме игнорируемых (.gitignore, info/exclude, глобальный). */
const UNTRACKED_ARGS = ['ls-files', '-z', '--others', '--exclude-standard']

/** Пути одного вызова ls-files: точные файлы и те, что надо проверить на диске. */
type CollectedPaths = { entries: Map<string, GitPathEntry['kind']>; complete: boolean }

/**
 * Пути из одного вызова ls-files потоком: больше предела - git гасится, а не
 * выдаёт сотни тысяч строк впустую. Повторы (стадии конфликта слияния) схлопываются.
 * git не смог - null: дальше обход без git.
 */
const collectGitPaths = async (
  rootPath: string,
  args: string[],
  parse: (record: string) => GitPathEntry | null,
  signal: AbortSignal,
): Promise<CollectedPaths | null> => {
  const reader = new RecordReader(LS_FILES_DELIMITERS)
  const entries = new Map<string, GitPathEntry['kind']>()
  const outcome = await streamGit(rootPath, args, {
    signal,
    onData: (chunk) => {
      for (const {
        fields: [record = ''],
      } of reader.push(chunk)) {
        const entry = parse(record)

        if (entry?.kind === 'removed') entries.delete(entry.path)
        else if (entry) entries.set(entry.path, entry.kind)
      }

      return entries.size <= PROJECT_FILES_LIMIT
    },
  })

  if (outcome.kind === 'stopped') return { entries, complete: false }
  if (outcome.exitCode === 0) return { entries, complete: true }

  console.warn(
    `[search] git ${args.join(' ')} завершился с кодом ${outcome.exitCode}:`,
    outcome.stderr,
  )

  return null
}

/** Пути отслеживаемых и новых файлов из обоих вызовов. git не запустился - null. */
const collectBoth = async (
  rootPath: string,
  cancel?: AbortSignal,
): Promise<[CollectedPaths | null, CollectedPaths | null]> => {
  const deadline = AbortSignal.timeout(PROJECT_FILES_TIMEOUT_MS)
  const signal = cancel ? AbortSignal.any([cancel, deadline]) : deadline

  try {
    return await Promise.all([
      collectGitPaths(rootPath, TRACKED_ARGS, parseTrackedEntry, signal),
      collectGitPaths(rootPath, UNTRACKED_ARGS, parseUntrackedEntry, signal),
    ])
  } catch (error) {
    console.warn('[search] git ls-files не запустился:', error)

    return [null, null]
  }
}

/**
 * Файлы репозитория по git: сначала отслеживаемые, за ними новые, игнорируемых нет.
 * Пути как отдал git - для чтения с диска; окну - через listProjectFiles. Отмена -
 * то, что успели, с truncated. git не справился - null.
 */
export const listGitFiles = async (
  rootPath: string,
  cancel?: AbortSignal,
): Promise<ProjectFileList | null> => {
  const [tracked, untracked] = await collectBoth(rootPath, cancel)

  if (!tracked || !untracked) return null

  const exact = [...tracked.entries].filter(([, kind]) => kind === 'file').map(([path]) => path)
  const unverified = [...tracked.entries, ...untracked.entries]
    .filter(([, kind]) => kind === 'unverified')
    .map(([path]) => path)
  const room = Math.max(PROJECT_FILES_LIMIT - exact.length, 0)
  // На один больше, чем помещается: так видно, что список пришлось обрезать.
  const checked = await keepRegularFiles(rootPath, unverified, room + 1)
  const paths = [...exact, ...checked]

  return {
    paths: paths.slice(0, PROJECT_FILES_LIMIT),
    truncated: !tracked.complete || !untracked.complete || paths.length > PROJECT_FILES_LIMIT,
  }
}

/** Пути для окна: NFC (см. toWindowPath) и без повторов, которые могло дать приведение. */
const forWindow = ({ paths, truncated }: ProjectFileList): ProjectFileList => ({
  paths: [...new Set(paths.map(toWindowPath))],
  truncated,
})

/**
 * Все файлы проекта для поиска по имени. В git - отслеживаемые и новые без
 * игнорируемых, пути от корня проекта через «/». Без git (или git не справился) -
 * обход папки без служебных и тяжёлых каталогов.
 */
export const listProjectFiles = async (rootPath: string): Promise<ProjectFileList> => {
  const listed = (await isGitScope(rootPath)) ? await listGitFiles(rootPath) : null

  return forWindow(
    listed ??
      (await walkProjectFiles(rootPath, {
        limit: PROJECT_FILES_LIMIT,
        signal: AbortSignal.timeout(PROJECT_FILES_TIMEOUT_MS),
      })),
  )
}
