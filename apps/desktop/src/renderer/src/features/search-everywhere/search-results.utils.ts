import { TEXT_QUERY_MAX_LENGTH } from '@shared/search'
import type { TextMatch } from '@shared/search'

import type { PreparedFile } from '../../lib/file-match.types'
import { toNeedle, rankFiles as rankProjectFiles } from '../../lib/file-match.utils'
import { fuzzyMatch } from '../../lib/fuzzy-match.utils'
import {
  TEXT_MIN_QUERY,
  KEYWORD_ONLY_SCORE,
  ALL_TAB_GROUP_LIMIT,
} from './search-everywhere.constants'
import type {
  SearchTab,
  FileResult,
  TextResult,
  ActionResult,
  SearchAction,
  SearchResult,
  SearchStatus,
  SearchSection,
  SearchStatusInput,
} from './search-everywhere.types'

/** Файлы под запрос, лучшие сверху - строками списка поиска. */
export const rankFiles = (files: readonly PreparedFile[], query: string, limit: number) =>
  rankProjectFiles(files, query, limit).map((result): FileResult => ({ kind: 'file', ...result }))

/**
 * Действия под запрос. Ищется по подписи, а если не совпало - по ключевым словам
 * (такое ниже и без подсветки). Пустой запрос - все действия по порядку: их немного,
 * и вкладку «Actions» открывают и чтобы просто посмотреть, что умеет IDE.
 */
export const rankActions = (actions: readonly SearchAction[], query: string) => {
  const needle = toNeedle(query)

  if (needle === '') {
    return actions.map((action): ActionResult => ({
      kind: 'action',
      action,
      match: { score: 0, ranges: [] },
    }))
  }

  const results: ActionResult[] = []

  for (const action of actions) {
    const byLabel = fuzzyMatch(needle, action.label)
    const byKeyword = byLabel
      ? null
      : (action.keywords ?? []).some((keyword) => fuzzyMatch(needle, keyword) !== null)

    if (byLabel) results.push({ kind: 'action', action, match: byLabel })
    else if (byKeyword)
      results.push({
        kind: 'action',
        action,
        match: { score: KEYWORD_ONLY_SCORE, ranges: [] },
      })
  }

  return results.sort((left, right) => right.match.score - left.match.score)
}

export const toTextResults = (matches: readonly TextMatch[]): TextResult[] =>
  matches.map((match) => ({ kind: 'text', match }))

type ResultsByKind = { files: FileResult[]; actions: ActionResult[]; text: TextResult[] }

/**
 * Группы списка для вкладки. «All» - понемногу файлов и действий с заголовками
 * групп; остальные вкладки - одна группа своего вида целиком. Пустые группы не
 * показываются.
 */
export const buildSections = (tab: SearchTab, results: ResultsByKind): SearchSection[] => {
  const sections: SearchSection[] =
    tab === 'all'
      ? [
          { kind: 'file', results: results.files.slice(0, ALL_TAB_GROUP_LIMIT) },
          { kind: 'action', results: results.actions.slice(0, ALL_TAB_GROUP_LIMIT) },
        ]
      : tab === 'files'
        ? [{ kind: 'file', results: results.files }]
        : tab === 'actions'
          ? [{ kind: 'action', results: results.actions }]
          : [{ kind: 'text', results: results.text }]

  return sections.filter((section) => section.results.length > 0)
}

/** Все строки подряд: номер выделенной стрелками строки считается по этому списку. */
export const flattenSections = (sections: readonly SearchSection[]): SearchResult[] =>
  sections.flatMap((section) => section.results)

/** С какого номера плоского списка начинается каждая группа. */
export const sectionOffsets = (sections: readonly SearchSection[]): number[] =>
  sections.map((_, index) =>
    sections.slice(0, index).reduce((sum, section) => sum + section.results.length, 0),
  )

/** Запрос, который ищется во вкладке Text: не короче двух символов и не длиннее предела. */
export const isTextQuery = (needle: string) =>
  needle.length >= TEXT_MIN_QUERY && needle.length <= TEXT_QUERY_MAX_LENGTH

/**
 * Что сказать под списком. Есть результаты - ничего (пометку «не всё» решает
 * вызывающий). Нет - почему: нет проекта, запрос пуст, короток или длинен, ищется
 * или правда ничего нет.
 */
export const searchStatus = ({
  tab,
  needle,
  hasProject,
  resultCount,
  isPending,
}: SearchStatusInput): SearchStatus => {
  if (resultCount > 0) return 'ready'
  if ((tab === 'files' || tab === 'text') && !hasProject) return 'noProject'
  if (needle === '' && tab !== 'actions') return 'typeToSearch'
  if (tab === 'text' && needle.length < TEXT_MIN_QUERY) return 'shortQuery'
  if (tab === 'text' && needle.length > TEXT_QUERY_MAX_LENGTH) return 'longQuery'
  if (isPending) return 'loading'

  return 'nothingFound'
}

/** Ключ строки: для React и для «список поменялся - выделение на первую строку». */
export const resultKey = (result: SearchResult) =>
  result.kind === 'file'
    ? `file:${result.file.path}`
    : result.kind === 'action'
      ? `action:${result.action.id}`
      : `text:${result.match.relativePath}:${result.match.line}`

/** Выбрали строку: действие - запустить, файл или найденную строку - открыть. */
export const openResult = (result: SearchResult, onOpenFile: (relativePath: string) => void) => {
  if (result.kind === 'action') result.action.run()
  else onOpenFile(result.kind === 'file' ? result.file.path : result.match.relativePath)
}
