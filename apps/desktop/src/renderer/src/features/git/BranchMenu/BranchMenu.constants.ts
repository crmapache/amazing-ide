import { Plus, ArrowUpRight, ArrowDownLeft, GitCommitHorizontal } from 'lucide-react'

import type { BranchMenuEntry } from './BranchMenu.types'

/** Действия над репозиторием - верхняя группа меню, как в WebStorm. */
export const REPOSITORY_ACTIONS: readonly BranchMenuEntry[] = [
  { id: 'update', labelKey: 'git.updateProject', icon: ArrowDownLeft },
  { id: 'commit', labelKey: 'git.commit', icon: GitCommitHorizontal },
  { id: 'push', labelKey: 'git.push', icon: ArrowUpRight },
]

/** Действия с ветками - вторая группа. У «Checkout…» иконки нет и в WebStorm. */
export const BRANCH_ACTIONS: readonly BranchMenuEntry[] = [
  { id: 'newBranch', labelKey: 'git.newBranch', icon: Plus },
  { id: 'checkoutRevision', labelKey: 'git.checkoutRevision', icon: undefined },
]
