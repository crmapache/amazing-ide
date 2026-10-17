import type { GitAction, GitActionEntry } from './git-actions.types'

/** Действие, которое уже умеем делать (commit - ещё нет). */
export const isAvailableAction = (id: string): id is GitAction => id !== 'commit'

/** Только доступные действия - для поиска везде, где недоступному пункту не место. */
export const availableActions = (entries: readonly GitActionEntry[]) =>
  entries.filter((entry): entry is GitActionEntry & { id: GitAction } =>
    isAvailableAction(entry.id),
  )
