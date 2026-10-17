import type { SearchAction } from '../search-everywhere.types'

export type SearchEverywhereProps = {
  /** Активный проект. Нет - ищутся только действия. */
  projectId: string | undefined
  /** Действия IDE: собирает workbench, он видит все фичи. */
  actions: readonly SearchAction[]
  /** Выбран файл или найденная строка: открыть файл активного проекта. */
  onOpenFile: (relativePath: string) => void
}
