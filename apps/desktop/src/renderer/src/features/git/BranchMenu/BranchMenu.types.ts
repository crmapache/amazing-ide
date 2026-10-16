import type { LucideIcon } from 'lucide-react'

import type { GitHead, GitBranchKind } from '@shared/git'

/** Действия меню, которым нужно окно или итог в углу: их делает BranchSwitcher. */
export type BranchMenuAction = 'update' | 'push' | 'newBranch' | 'checkoutRevision'

export type BranchMenuProps = {
  projectId: string
  head: GitHead
  onSwitch: (branch: string, kind: GitBranchKind) => void
  onAction: (action: BranchMenuAction) => void
}

/** Пункт-действие. commit пока недоступен: для него нужен свой инструмент. */
export type BranchMenuEntry = {
  id: BranchMenuAction | 'commit'
  labelKey:
    'git.updateProject' | 'git.commit' | 'git.push' | 'git.newBranch' | 'git.checkoutRevision'
  icon: LucideIcon | undefined
}
