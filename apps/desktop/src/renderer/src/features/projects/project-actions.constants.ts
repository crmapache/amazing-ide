import { Plus, GitFork, FolderOpen } from 'lucide-react'

import type { ProjectActionEntry } from './project-actions.types'

/** Создать, открыть, клонировать - верх меню проекта, как в WebStorm. */
export const PROJECT_ACTIONS: readonly ProjectActionEntry[] = [
  { id: 'new', labelKey: 'projects.newProject', icon: Plus, keywords: ['create'] },
  // ⌘O - пункт File → Open Project… в меню приложения (main/menu.ts).
  { id: 'open', labelKey: 'projects.openEllipsis', icon: FolderOpen, shortcut: '⌘O', keywords: [] },
  { id: 'clone', labelKey: 'projects.cloneRepository', icon: GitFork, keywords: ['git'] },
]
