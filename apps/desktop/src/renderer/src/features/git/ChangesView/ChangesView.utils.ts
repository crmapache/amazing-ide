import type { GitChange } from '@shared/git'

import type { ChangeGroupData } from './ChangesView.types'

/**
 * Список изменений по группам: сначала то, что git знает, потом новые файлы. Порядок
 * внутри группы - порядок git (по пути); пустых групп нет.
 */
export const groupChanges = (files: readonly GitChange[]): ChangeGroupData[] => {
  const groups: ChangeGroupData[] = [
    { id: 'tracked', files: files.filter((change) => change.kind !== 'untracked') },
    { id: 'untracked', files: files.filter((change) => change.kind === 'untracked') },
  ]

  return groups.filter((group) => group.files.length > 0)
}
