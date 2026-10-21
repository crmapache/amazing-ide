import type { GitChange, GitHeadFile } from '@shared/git'

import type { DocumentStatus } from '../editor.types'

export type DiffEditorProps = {
  projectId: string
  /** Файл, чья разница показана: путь от корня проекта. */
  path: string
  /** Активна ли вкладка разницы: спрятанная за файлом клавиатуру не берёт. */
  isActive: boolean
}

/** Версия из коммита, которую не показать строками: не текст, слишком большая, не прочиталась. */
export type HeadProblem = Exclude<GitHeadFile, { kind: 'text' | 'missing' }>

/** Файл на диске, который не показать строками - то же, что редактор показывает словами. */
export type FileProblem = Exclude<DocumentStatus, { kind: 'text' | 'loading' | 'missing' }>

/**
 * Что можно показать сейчас. ready: левая сторона - текст из коммита (у нового файла
 * пусто), правая - документ файла или пусто (файл удалён), только для чтения - удалённый и
 * файл без права записи. Иначе - ещё читается или почему строк нет.
 */
export type DiffState =
  | { kind: 'loading' }
  | { kind: 'ready'; original: string; modified: 'document' | 'empty'; readOnly: boolean }
  | { kind: 'headProblem'; file: HeadProblem }
  | { kind: 'fileProblem'; status: FileProblem }

/** Соседи файла в списке изменений: куда ведут «предыдущий» и «следующий файл». */
export type ChangeNeighbours = { previous: GitChange | null; next: GitChange | null }

/** Что умеет панель над разницей: переходы по правкам и файлам, открыть сам файл. */
export type DiffActions = {
  previousChange: () => void
  nextChange: () => void
  openFile: (() => void) | null
}

/** Что поменялось, кроме строк: переводы строк, метка порядка байтов, права файла. */
export type DiffNote = 'eol' | 'bom' | 'mode'

/**
 * Подпись счёта над разницей: ещё сравнивает, сравнивать нечего, различий нет (или нет в
 * тексте - поменялось только невидимое), столько-то различий; и что ещё поменялось.
 */
export type DiffSummary = {
  key: 'counting' | 'none' | 'noDifferences' | 'noTextDifferences' | 'differences'
  count: number
  notes: readonly DiffNote[]
}

export type DiffToolbarProps = {
  projectId: string
  path: string
  change: GitChange | null
  summary: DiffSummary
  neighbours: ChangeNeighbours
  actions: DiffActions
}

export type DiffPlaceholderProps = {
  state: Extract<DiffState, { kind: 'headProblem' | 'fileProblem' }>
}
