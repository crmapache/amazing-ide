import { useQuery } from '@tanstack/react-query'

import { invoke } from '../lib/ipc'
import { QUERY_KEYS } from './query-keys'

/** Версия и режим приложения. За время жизни окна не меняются. */
export const useAppInfo = () =>
  useQuery({
    queryKey: QUERY_KEYS.appInfo,
    queryFn: () => invoke('app:getInfo'),
    staleTime: Infinity,
  })
