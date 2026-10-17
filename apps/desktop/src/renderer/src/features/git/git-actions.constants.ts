import { Plus, ArrowUpRight, ArrowDownLeft, GitCommitHorizontal } from 'lucide-react'

import type { GitActionEntry } from './git-actions.types'

/** Действия над репозиторием - верхняя группа меню ветки, как в WebStorm. */
export const GIT_REPOSITORY_ACTIONS: readonly GitActionEntry[] = [
  { id: 'update', labelKey: 'git.updateProject', icon: ArrowDownLeft, keywords: ['git', 'pull'] },
  { id: 'commit', labelKey: 'git.commit', icon: GitCommitHorizontal, keywords: ['git'] },
  { id: 'push', labelKey: 'git.push', icon: ArrowUpRight, keywords: ['git'] },
]

/** Действия с ветками - вторая группа. У «Checkout…» иконки нет и в WebStorm. */
export const GIT_BRANCH_ACTIONS: readonly GitActionEntry[] = [
  { id: 'newBranch', labelKey: 'git.newBranch', icon: Plus, keywords: ['git', 'branch'] },
  {
    id: 'checkoutRevision',
    labelKey: 'git.checkoutRevision',
    icon: undefined,
    keywords: ['git', 'tag', 'commit'],
  },
]
