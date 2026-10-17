import { TEXT_QUERY_MAX_LENGTH } from '@shared/search'
import type { TextMatch } from '@shared/search'

import { splitPath } from '../../lib/path.utils'
import { fuzzyMatch } from './fuzzy-match.utils'
import {
  MATCH_SCORE,
  TEXT_MIN_QUERY,
  ALL_TAB_GROUP_LIMIT,
  FOLDER_SCORE_WEIGHT,
} from './search-everywhere.constants'
import type {
  SearchTab,
  FileResult,
  FuzzyMatch,
  TextResult,
  ActionResult,
  PreparedFile,
  SearchAction,
  SearchResult,
  SearchStatus,
  SearchSection,
  SearchStatusInput,
} from './search-everywhere.types'

/**
 * Запрос для сравнения имён: нижний регистр, NFC (буква «й» с клавиатуры и из имени
 * файла - один символ) и без пробелов. Пробел разделяет слова, как в WebStorm:
 * «tree node» находит FileTreeNode, а не требует пробела в имени.
 */
const toNeedle = (query: string) => query.normalize('NFC').toLowerCase().replace(/\s+/g, '')

/** Разбор списка файлов один раз на открытие поиска, а не на каждую букву запроса. */
export const prepareFiles = (paths: readonly string[]): PreparedFile[] =>
  paths.map((path) => {
    const { name, folder } = splitPath(path)

    return { path, name, folder, pathLower: path.toLowerCase(), nameLower: name.toLowerCase() }
  })

const compareResults = (left: FileResult, right: FileResult) =>
  right.match.score - left.match.score ||
  left.file.path.length - right.file.path.length ||
  left.file.path.localeCompare(right.file.path)

/**
 * Совпадение файла с запросом. Запрос со «/» делится по последнему слешу: начало
 * ищется в папке, хвост - в имени (`tree/node` найдёт `file-tree/FileTreeNode.tsx`).
 * Подсвечивается только имя - папка в списке идёт серым пояснением.
 */
const matchFile = (file: PreparedFile, needle: string): FuzzyMatch | null => {
  const slash = needle.lastIndexOf('/')

  if (slash < 0) return fuzzyMatch(needle, file.name, file.nameLower)

  const byName = fuzzyMatch(needle.slice(slash + 1), file.name, file.nameLower)
  const folderLower = file.pathLower.slice(0, file.pathLower.length - file.nameLower.length)
  const byFolder = byName && fuzzyMatch(needle.slice(0, slash), file.folder, folderLower)

  if (!byName || !byFolder) return null

  return { score: byName.score + byFolder.score * FOLDER_SCORE_WEIGHT, ranges: byName.ranges }
}

/**
 * Файлы под запрос, лучшие сверху. Без «/» ищется только по имени файла, как в
 * WebStorm. Пустой запрос - ничего: весь проект списком не нужен никому.
 */
export const rankFiles = (files: readonly PreparedFile[], query: string, limit: number) => {
  const needle = toNeedle(query)

  if (needle === '') return []

  const results: FileResult[] = []

  for (const file of files) {
    const match = matchFile(file, needle)

    if (match) results.push({ kind: 'file', file, match })
  }

  return results.sort(compareResults).slice(0, limit)
}

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
        match: { score: MATCH_SCORE.keywordOnly, ranges: [] },
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
