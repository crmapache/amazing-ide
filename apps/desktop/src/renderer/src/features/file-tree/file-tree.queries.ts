import type { DirectoryEntry } from '@shared/fs'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { useIpcEvent } from '../../lib/ipc.hooks'
import { QUERY_KEYS } from '../../state/query-keys'
import { isInsideAny, symlinkedFolders } from './file-tree.utils'

/**
 * Содержимое одного каталога проекта. Читается при раскрытии папки, один раз: когда на
 * диске что-то появится или пропадёт, главный процесс скажет (fs:changed), и
 * useDirectorySync сбросит кэш этой папки.
 */
export const useDirectory = (projectId: string, relativePath: string) =>
  useQuery({
    queryKey: QUERY_KEYS.directory(projectId, relativePath),
    queryFn: () => invoke('fs:readDirectory', { projectId, relativePath }),
    staleTime: Infinity,
  })

/**
 * Изменения на диске - перечитать папки, где они случились: раскрытые перечитаются
 * сразу, свёрнутые - когда их раскроют. Со всем, что под ними, перечитываются:
 * переименованные (macOS говорит только о самой папке, а кэш её подпапок - по старому
 * месту, и после переименования туда и обратно показал бы прежнее) и папки-ссылки
 * (macOS сообщает о настоящем пути цели, не о ссылке). null - перечитать все папки
 * проекта. Подключается один раз, в корне окна.
 */
export const useDirectorySync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('fs:changed', ({ projectId, directories, renamed }) => {
    const projectKey = QUERY_KEYS.projectDirectories(projectId)

    if (directories === null) {
      void queryClient.invalidateQueries({ queryKey: projectKey })

      return
    }

    for (const directory of directories) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.directory(projectId, directory),
        exact: true,
      })
    }

    const listings = queryClient
      .getQueriesData<DirectoryEntry[]>({ queryKey: projectKey })
      .map(([, entries]) => entries)
    const subtrees = [...renamed, ...symlinkedFolders(listings)]

    if (subtrees.length === 0) return

    void queryClient.invalidateQueries({
      queryKey: projectKey,
      predicate: ({ queryKey: [, , , relativePath] }) =>
        typeof relativePath === 'string' && isInsideAny(relativePath, subtrees),
    })
  })
}
