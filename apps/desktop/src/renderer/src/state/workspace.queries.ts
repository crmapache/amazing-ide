import type { WorkspaceState } from '@shared/workspace'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../lib/ipc'
import { useIpcEvent } from '../lib/ipc.hooks'
import { QUERY_KEYS } from './query-keys'

/**
 * Открытые проекты. Владелец - главный процесс; здесь их зеркало в кэше React
 * Query под одним ключом. Пишут в него три источника - первый запрос, ответы на
 * действия и событие workspace:changed (пункт меню Open Project меняет состояние
 * без участия окна), - и все читают отсюда.
 */
export const useWorkspace = () =>
  useQuery({
    queryKey: QUERY_KEYS.workspace,
    queryFn: () => invoke('workspace:get'),
    staleTime: Infinity,
  })

export const useActiveProject = () => {
  const { data } = useWorkspace()

  return data?.projects.find((project) => project.id === data.activeProjectId) ?? null
}

/** Держит кэш в синхроне с главным процессом. Подключается один раз, в корне окна. */
export const useWorkspaceSync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('workspace:changed', (state) => {
    queryClient.setQueryData(QUERY_KEYS.workspace, state)
  })
}

/** Действия над проектами. Ответ главного процесса сразу ложится в кэш. */
export const useWorkspaceActions = () => {
  const queryClient = useQueryClient()
  const onSuccess = (state: WorkspaceState) => queryClient.setQueryData(QUERY_KEYS.workspace, state)

  const open = useMutation({ mutationFn: () => invoke('workspace:openProject'), onSuccess })
  const create = useMutation({ mutationFn: () => invoke('workspace:newProject'), onSuccess })
  const openRecent = useMutation({
    mutationFn: (rootPath: string) => invoke('workspace:openRecentProject', { rootPath }),
    onSuccess,
  })
  const close = useMutation({
    mutationFn: (projectId: string) => invoke('workspace:closeProject', { projectId }),
    onSuccess,
  })
  const activate = useMutation({
    mutationFn: (projectId: string) => invoke('workspace:activateProject', { projectId }),
    onSuccess,
  })

  return {
    openProject: () => open.mutate(),
    newProject: () => create.mutate(),
    openRecentProject: (rootPath: string) => openRecent.mutate(rootPath),
    closeProject: (projectId: string) => close.mutate(projectId),
    activateProject: (projectId: string) => activate.mutate(projectId),
  }
}
