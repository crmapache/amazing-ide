import type { GitHead, GitBranchKind } from '@shared/git'

import type { GitAction } from '../git-actions.types'

export type BranchMenuProps = {
  projectId: string
  head: GitHead
  onSwitch: (branch: string, kind: GitBranchKind) => void
  onAction: (action: GitAction) => void
}
