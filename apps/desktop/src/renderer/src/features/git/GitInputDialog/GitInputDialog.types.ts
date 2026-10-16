import type { GitActionResult } from '@shared/git'

export type GitInputDialogProps = {
  open: boolean
  title: string
  label: string
  placeholder: string
  submitLabel: string
  /** Выполнить действие. Не получилось - ответ git показывается под полем. */
  onSubmit: (value: string) => Promise<GitActionResult>
  onClose: () => void
}
