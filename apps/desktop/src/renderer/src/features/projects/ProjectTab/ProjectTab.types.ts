import type { Project } from '@shared/workspace'

export type ProjectTabProps = {
  project: Project
  isActive: boolean
  onActivate: (projectId: string) => void
  onClose: (projectId: string) => void
}
