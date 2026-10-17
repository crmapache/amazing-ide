import type { LucideIcon } from 'lucide-react'

import type { TextMatch } from '@shared/search'

import type { TextRange } from '@amazing-ide/ui/ListBoxOption.types'

/** Вкладки поиска, как в WebStorm. Classes и Symbols появятся вместе с разбором кода. */
export type SearchTab = 'all' | 'files' | 'actions' | 'text'

/**
 * Действие IDE в поиске. Собирает их workbench: только он видит все фичи сразу, а
 * поиск лишь показывает и запускает.
 */
export type SearchAction = {
  id: string
  label: string
  icon?: LucideIcon | undefined
  /** Ещё слова, по которым действие находится: «git», «pull». Не подсвечиваются. */
  keywords?: readonly string[] | undefined
  /** Сочетание клавиш - справа серым. */
  shortcut?: string | undefined
  run: () => void
}

/** Насколько текст подходит под запрос и какие его символы совпали. */
export type FuzzyMatch = {
  score: number
  ranges: TextRange[]
}

/** Файл проекта, заранее разобранный для поиска: имя отдельно, нижний регистр готов. */
export type PreparedFile = {
  path: string
  name: string
  folder: string
  pathLower: string
  nameLower: string
}

export type FileResult = { kind: 'file'; file: PreparedFile; match: FuzzyMatch }

export type ActionResult = { kind: 'action'; action: SearchAction; match: FuzzyMatch }

export type TextResult = { kind: 'text'; match: TextMatch }

/** Строка списка результатов - одна из трёх категорий. */
export type SearchResult = FileResult | ActionResult | TextResult

/** Группа результатов вкладки «All» с заголовком; у остальных вкладок группа одна, без него. */
export type SearchSection = {
  kind: SearchResult['kind']
  results: SearchResult[]
}

/** Что показать под списком вместо результатов или вдобавок к ним. */
export type SearchStatus =
  'ready' | 'noProject' | 'typeToSearch' | 'shortQuery' | 'longQuery' | 'loading' | 'nothingFound'

/** Из чего выводится статус: только флаги и строки, без React. */
export type SearchStatusInput = {
  tab: SearchTab
  needle: string
  hasProject: boolean
  resultCount: number
  isPending: boolean
}

/** Клавиша для распознавания сочетаний: только то, что нужно, без всего KeyboardEvent. */
export type KeyStroke = {
  type: string
  key: string
  code: string
  repeat: boolean
  timeStamp: number
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  ctrlKey: boolean
}
