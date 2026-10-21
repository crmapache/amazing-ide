import type { GitChanges } from '@shared/git'
import { useQuery, queryOptions, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../lib/ipc'
import { useIpcEvent } from '../lib/ipc.hooks'
import { QUERY_KEYS } from './query-keys'

/**
 * Изменённые файлы проекта относительно последнего коммита. Владелец - главный процесс:
 * с первого вопроса он перечитывает список сам при изменениях на диске и в .git и
 * присылает его (git:changes). Спрашиваем ещё при возврате в окно - на случай, если
 * что-то прошло мимо слежения. Нужен виду Changes и разнице файла, поэтому живёт здесь.
 */
const gitChangesQuery = (projectId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.gitChanges(projectId),
    queryFn: () => invoke('git:getChanges', { projectId }),
    staleTime: Infinity,
    refetchOnWindowFocus: 'always',
  })

/** Список изменений проекта или почему его нет; undefined - ещё читается. */
export const useGitChanges = (projectId: string): GitChanges | undefined =>
  useQuery(gitChangesQuery(projectId)).data

/** Новый список изменений от главного процесса - в кэш. Подключается один раз, в корне окна. */
export const useGitChangesSync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('git:changes', ({ projectId, changes }) => {
    queryClient.setQueryData(QUERY_KEYS.gitChanges(projectId), changes)
  })
}
