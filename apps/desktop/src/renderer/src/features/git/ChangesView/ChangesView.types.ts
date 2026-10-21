import type { GitChange } from '@shared/git'

/**
 * Группы списка, как в окне Commit у WebStorm: то, что git уже знает (изменено, добавлено,
 * удалено, переименовано, конфликт), и новые файлы, которых в git ещё нет.
 */
export type ChangeGroupId = 'tracked' | 'untracked'

export type ChangeGroupData = { id: ChangeGroupId; files: readonly GitChange[] }

/** Строка, на которой открыли меню, и куда его поставить; null - меню закрыто. */
export type ChangeMenuTarget = { change: GitChange; anchor: HTMLElement } | null

export type ProjectChangesProps = { projectId: string }

export type ChangeGroupProps = {
  projectId: string
  group: ChangeGroupData
  onMenu: (change: GitChange, anchor: HTMLElement) => void
}

export type ChangeRowProps = {
  projectId: string
  change: GitChange
  onMenu: (change: GitChange, anchor: HTMLElement) => void
}

export type ChangeMenuProps = {
  projectId: string
  target: ChangeMenuTarget
  onClose: () => void
}
