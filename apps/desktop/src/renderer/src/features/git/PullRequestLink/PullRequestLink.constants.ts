import type { LucideIcon } from 'lucide-react'
import { GitMerge, GitPullRequest, GitPullRequestDraft, GitPullRequestClosed } from 'lucide-react'

import type { GitPullRequestState } from '@shared/git'

/**
 * Состояние PR - формой значка, как на GitHub, а не цветом: цвет в IDE несёт смысл
 * «в порядке / внимание / ошибка» (ADR 0006), а слитый PR - ни то, ни другое.
 */
export const PULL_REQUEST_ICONS: Record<GitPullRequestState, LucideIcon> = {
  open: GitPullRequest,
  draft: GitPullRequestDraft,
  merged: GitMerge,
  closed: GitPullRequestClosed,
}
