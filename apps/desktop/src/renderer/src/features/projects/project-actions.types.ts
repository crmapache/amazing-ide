import type { LucideIcon } from 'lucide-react'

export type ProjectAction = 'new' | 'open' | 'clone'

/** Действие с проектами для меню проекта и поиска везде - одно описание на оба места. */
export type ProjectActionEntry = {
  id: ProjectAction
  labelKey: 'projects.newProject' | 'projects.openEllipsis' | 'projects.cloneRepository'
  icon: LucideIcon
  /** Сочетание из меню приложения - поиск показывает его справа. */
  shortcut?: string | undefined
  /** Ещё слова, по которым действие находит поиск везде. */
  keywords: readonly string[]
}
