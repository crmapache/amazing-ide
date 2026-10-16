import type { GitActionResult } from '@shared/git'

export type PushDialogProps = {
  open: boolean
  projectId: string
  onPush: () => Promise<GitActionResult>
  onClose: () => void
}
