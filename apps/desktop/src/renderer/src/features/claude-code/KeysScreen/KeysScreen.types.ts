/** Раздел шпаргалки, как в ACC. */
export type KeyGroupId = 'tabs' | 'message' | 'agent' | 'panel' | 'search'

/** Строки, которым нужно сказать «когда» (claudeCode.keys.rows.<id>.when). */
export type KeyWhenRowId =
  | 'nextTab'
  | 'previousTab'
  | 'closeTab'
  | 'reopenTab'
  | 'openPanel'
  | 'queue'
  | 'history'
  | 'shell'
  | 'stop'
  | 'answer'
  | 'fork'

/** Строка шпаргалки - подпись по id (claudeCode.keys.rows.<id>.label). */
export type KeyRowId =
  | KeyWhenRowId
  | 'newTab'
  | 'send'
  | 'newLine'
  | 'commands'
  | 'files'
  | 'deleteWord'
  | 'undo'
  | 'redo'
  | 'mode'
  | 'search'
  | 'searchChat'
  | 'searchAll'
  | 'searchAsk'
  | 'matchCase'
  | 'wholeWords'

/**
 * Строка шпаргалки: что делает, когда - если это нужно сказать, и клавиши. chords -
 * варианты («↑» или «↓»), каждый - клавиши, нажатые вместе.
 */
export type KeyRow = {
  id: KeyRowId
  when: KeyWhenRowId | null
  chords: readonly (readonly string[])[]
}

export type KeyGroup = { id: KeyGroupId; rows: readonly KeyRow[] }
