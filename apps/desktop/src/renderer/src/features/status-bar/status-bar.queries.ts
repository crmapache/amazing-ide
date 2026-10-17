import { useQuery } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { usePageVisible } from '../../lib/page-visibility.hooks'
import { QUERY_KEYS } from '../../state/query-keys'
import { RESOURCE_USAGE_POLL_MS } from './status-bar.constants'

/**
 * Процессор и память IDE, раз в секунду, пока окно видно. «В фоне» опрос не
 * останавливается намеренно: фон для React Query здесь - потеря фокуса окна
 * (app/query-client.ts), а строку состояния видно и при работе в соседнем окне.
 */
export const useResourceUsage = () => {
  const isPageVisible = usePageVisible()

  return useQuery({
    queryKey: QUERY_KEYS.resourceUsage,
    queryFn: () => invoke('app:getResourceUsage'),
    refetchInterval: isPageVisible ? RESOURCE_USAGE_POLL_MS : false,
    refetchIntervalInBackground: true,
  })
}
