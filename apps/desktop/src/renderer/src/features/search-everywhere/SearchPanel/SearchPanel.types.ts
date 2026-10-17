import type {
  SearchTab,
  SearchAction,
  SearchResult,
  SearchStatus,
} from '../search-everywhere.types'

export type SearchPanelProps = {
  /** Активный проект: в нём ищутся файлы и текст. Нет проекта - ищутся только действия. */
  projectId: string | undefined
  actions: readonly SearchAction[]
  tab: SearchTab
  onTabChange: (tab: SearchTab) => void
  onOpenFile: (relativePath: string) => void
  onClose: () => void
}

export type SearchResultsInput = {
  tab: SearchTab
  query: string
  projectId: string | undefined
  actions: readonly SearchAction[]
}

export type SearchResultOptionProps = {
  id: string
  result: SearchResult
  active: boolean
  onSelect: () => void
  onActivate: () => void
}

export type SearchStatusLineProps = {
  tab: SearchTab
  status: SearchStatus
  isFilesTruncated: boolean
  isTextTruncated: boolean
}
