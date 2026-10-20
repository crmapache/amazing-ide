import { useQuery, queryOptions, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { useIpcEvent } from '../../lib/ipc.hooks'
import { QUERY_KEYS } from '../../state/query-keys'
import { treeStatusOf } from './git-status.utils'

/**
 * Статусы git проекта. Владелец - главный процесс: он следит за диском и .git и сам
 * присылает новый статус (git:status). Спрашиваем при открытии и при возврате в окно -
 * на случай, если что-то прошло мимо слежения.
 */
const gitStatusQuery = (projectId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.gitStatus(projectId),
    queryFn: () => invoke('git:getStatus', { projectId }),
    staleTime: Infinity,
    refetchOnWindowFocus: 'always',
  })

/**
 * Статус одной строки дерева. Строка подписана только на свой статус: новый статус
 * проекта перерисовывает лишь те строки, чей цвет поменялся.
 */
export const useTreeStatus = (projectId: string, relativePath: string, isDirectory: boolean) =>
  useQuery({
    ...gitStatusQuery(projectId),
    select: (status) => treeStatusOf(status, relativePath, isDirectory),
  }).data ?? null

/** Новый статус от главного процесса - в кэш. Подключается один раз, в корне окна. */
export const useGitStatusSync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('git:status', ({ projectId, status }) => {
    queryClient.setQueryData(QUERY_KEYS.gitStatus(projectId), status)
  })
}
