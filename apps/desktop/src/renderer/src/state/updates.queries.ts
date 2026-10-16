import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../lib/ipc'
import { useIpcEvent } from '../lib/ipc.hooks'
import { QUERY_KEYS } from './query-keys'

/** Состояние обновления приложения. Ведёт его главный процесс. */
export const useUpdateStatus = () =>
  useQuery({
    queryKey: QUERY_KEYS.updateStatus,
    queryFn: () => invoke('updates:getStatus'),
    staleTime: Infinity,
  })

/** Держит кэш в синхроне с главным процессом. Подключается один раз, в корне окна. */
export const useUpdateStatusSync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('updates:status', (status) => {
    queryClient.setQueryData(QUERY_KEYS.updateStatus, status)
  })
}

/**
 * Действия с обновлением. Прогресс загрузки и итог приходят событием
 * updates:status, поэтому install ничего в кэш не пишет.
 */
export const useUpdateActions = () => {
  const queryClient = useQueryClient()

  const dismiss = useMutation({
    mutationFn: () => invoke('updates:dismiss'),
    onSuccess: (status) => queryClient.setQueryData(QUERY_KEYS.updateStatus, status),
  })

  return {
    install: () => void invoke('updates:install'),
    dismiss: () => dismiss.mutate(),
    openReleasePage: () => void invoke('updates:openReleasePage'),
  }
}
