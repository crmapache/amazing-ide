import type { FleetAgentState } from '@shared/claude-feed'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'

/**
 * Разговор агента флота с диска - только когда открыли его окно: флот из сорока держит
 * сорок транскриптов. Пустой agentId - читать нечего (отчёт его не назвал).
 */
export const useFleetTranscript = (
  conversationId: string,
  agentId: string,
  state: FleetAgentState,
) =>
  useQuery({
    queryKey: QUERY_KEYS.claudeFleetAgent(conversationId, agentId, state),
    queryFn: () => invoke('claude:readFleetAgent', { conversationId, agentId }),
    enabled: agentId.length > 0,
    staleTime: Infinity,
  })

/**
 * Остановить задачу CLI - субагента или фоновую команду - не трогая ход. Ответ -
 * состояние целиком, в кэш; о конце задачи CLI скажет лентой.
 */
export const useStopTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, taskId }: { conversationId: string; taskId: string }) =>
      invoke('claude:stopTask', { conversationId, taskId }),
    onSuccess: (state) => queryClient.setQueryData(QUERY_KEYS.claudeState, state),
    onError: (error) => console.warn('[claude-code] задача не остановлена:', error),
  })
}
