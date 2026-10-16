import { useQuery } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'

/**
 * Содержимое одного каталога проекта. Читается при раскрытии папки, один раз:
 * следить за изменениями на диске будет вотчер главного процесса, он и сбросит кэш.
 */
export const useDirectory = (projectId: string, relativePath: string) =>
  useQuery({
    queryKey: QUERY_KEYS.directory(projectId, relativePath),
    queryFn: () => invoke('fs:readDirectory', { projectId, relativePath }),
    staleTime: Infinity,
  })
