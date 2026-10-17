import { TEXT_QUERY_MAX_LENGTH } from '@shared/search'
import type { TextSearchResult } from '@shared/search'

import { streamGit } from '../git/git-stream'
import { searchFileList, searchFilesDirectly } from './fs-text-search'
import { isGitScope } from './git-scope'
import { parseGrepRecord } from './git-search-output'
import { MatchCollector } from './match-collector'
import { listGitFiles } from './project-files'
import { RecordReader } from './record-reader'
import {
  GIT_GREP_ENV,
  GREP_DELIMITERS,
  GREP_FIELD_MAX_BYTES,
  TEXT_SEARCH_TIMEOUT_MS,
  GIT_USAGE_ERROR_EXIT_CODE,
  TEXT_MATCHES_PER_FILE_LIMIT,
} from './search.constants'

/** Строка в одну строку файла с переводом строки или нулём не совпадёт никогда. */
const UNMATCHABLE = /[\0\r\n]/

/**
 * Буквальная строка без учёта регистра, отслеживаемые и новые файлы без
 * игнорируемых и двоичных. Настройки человека (grep.fullName, grep.column, цвет)
 * меняют формат вывода - флаги ставят его обратно. --max-count экономит вывод по
 * огромным файлам, но есть только с git 2.38: без него предел на файл держит
 * MatchCollector.
 */
const grepArgs = (query: string, withMaxCount: boolean) => [
  'grep',
  '--untracked',
  '-n',
  '-I',
  '-i',
  '-F',
  '-z',
  '--no-color',
  '--no-column',
  '--no-full-name',
  ...(withMaxCount ? [`--max-count=${TEXT_MATCHES_PER_FILE_LIMIT}`] : []),
  '-e',
  query,
  '--',
  '.',
]

/** done - ответ есть (в том числе пустой); unsupported - git не знает опцию. */
type GrepOutcome = 'done' | 'unsupported' | 'failed'

const runGrep = async (
  rootPath: string,
  query: string,
  collector: MatchCollector,
  signal: AbortSignal,
  withMaxCount: boolean,
): Promise<GrepOutcome> => {
  const reader = new RecordReader(GREP_DELIMITERS, GREP_FIELD_MAX_BYTES)
  const outcome = await streamGit(rootPath, grepArgs(query, withMaxCount), {
    env: GIT_GREP_ENV,
    signal,
    onData: (chunk) =>
      reader.push(chunk).every((record) => {
        const hit = parseGrepRecord(record)

        return hit === null || collector.add(hit.relativePath, hit.line, hit.text, hit.clipped)
      }),
  })

  if (outcome.kind === 'stopped') {
    if (signal.aborted) collector.markIncomplete()

    return 'done'
  }

  // Код 1 у git grep - «ничего не нашлось», это не ошибка.
  if (outcome.exitCode === 0 || outcome.exitCode === 1) return 'done'
  if (withMaxCount && outcome.exitCode === GIT_USAGE_ERROR_EXIT_CODE) return 'unsupported'

  console.warn(`[search] git grep завершился с кодом ${outcome.exitCode}:`, outcome.stderr)

  return 'failed'
}

/**
 * Поиск через git grep потоком. Набрали предел или прервали - git гасится, итог -
 * то, что успели. Старый git без --max-count - повтор без него: опцию git отвергает
 * до поиска, так что копилка ещё пуста. false - git grep не справился.
 */
const grepWithGit = async (
  rootPath: string,
  query: string,
  collector: MatchCollector,
  signal: AbortSignal,
): Promise<boolean> => {
  try {
    const outcome = await runGrep(rootPath, query, collector, signal, true)

    if (outcome !== 'unsupported') return outcome === 'done'

    return (await runGrep(rootPath, query, collector, signal, false)) === 'done'
  } catch (error) {
    console.warn('[search] git grep не запустился:', error)

    return false
  }
}

/**
 * git grep в репозитории не справился: ищем сами, но только по файлам, которые
 * перечислил git. Обход диска показал бы игнорируемое (.env, логи). Не смог и
 * ls-files - пустой неполный ответ: лучше ничего, чем игнорируемые секреты.
 * Копилка новая: то, что git grep успел найти до сбоя, не смешиваем.
 */
const searchGitListedFiles = async (
  rootPath: string,
  query: string,
  signal: AbortSignal,
): Promise<TextSearchResult> => {
  const collector = new MatchCollector(query)
  const files = await listGitFiles(rootPath, signal)

  if (files) await searchFileList(rootPath, files, query, collector, signal)
  else collector.markIncomplete()

  return collector.result()
}

/**
 * Защита контракта. Окно само не отправляет пустой запрос и запрос длиннее предела
 * (показывает об этом свой статус), так что такой сюда доходит только по ошибке
 * вызывающего - и это исключение, а не пустой ответ.
 */
const assertTextQuery = (query: string) => {
  if (query.length === 0) throw new Error('Пустой запрос поиска текста')
  if (query.length > TEXT_QUERY_MAX_LENGTH) {
    throw new Error(`Запрос поиска длиннее ${TEXT_QUERY_MAX_LENGTH} символов`)
  }
}

/**
 * Строки проекта с текстом, без учёта регистра. В git - git grep (игнорируемое не
 * смотрит), без git - обход папки. Отмена через signal и собственный предел времени
 * не роняют поиск: ответ - то, что успели найти, с truncated.
 */
export const searchText = async (
  rootPath: string,
  query: string,
  signal?: AbortSignal,
): Promise<TextSearchResult> => {
  assertTextQuery(query)

  if (UNMATCHABLE.test(query)) return { matches: [], truncated: false }

  const deadline = AbortSignal.timeout(TEXT_SEARCH_TIMEOUT_MS)
  const stop = signal ? AbortSignal.any([signal, deadline]) : deadline
  const collector = new MatchCollector(query)

  if (await isGitScope(rootPath)) {
    if (await grepWithGit(rootPath, query, collector, stop)) return collector.result()

    return searchGitListedFiles(rootPath, query, stop)
  }

  await searchFilesDirectly(rootPath, query, collector, stop)

  return collector.result()
}
