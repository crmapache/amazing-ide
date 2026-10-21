import type { WebImageRead, ProjectImageRead } from '@shared/preview-images'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { useIpcEvent } from '../../lib/ipc.hooks'
import { QUERY_KEYS } from '../../state/query-keys'
import { isTouched } from './documents.utils'

/** Картинка проекта, как её видит просмотр: unchanged до него не доходит. */
export type ProjectImage = Exclude<ProjectImageRead, { kind: 'unchanged' }>

/**
 * Картинка проекта для просмотра Markdown - data URL или причина, почему её нет.
 * Читается один раз; поменялся файл на диске - сбрасывает usePreviewImageSync, и
 * перечитывание с прежней версией (known) отвечает unchanged без байтов, если файл тот же.
 */
export const usePreviewImage = (projectId: string, relativePath: string) => {
  const queryClient = useQueryClient()
  const queryKey = QUERY_KEYS.projectImage(projectId, relativePath)

  return useQuery({
    queryKey,
    queryFn: async (): Promise<ProjectImage> => {
      const previous = queryClient.getQueryData<ProjectImage>(queryKey)
      const known = previous?.kind === 'image' ? previous.version : null
      const read = await invoke('fs:readImage', { projectId, relativePath, known })

      if (read.kind !== 'unchanged') return read
      if (previous) return previous

      return (await invoke('fs:readImage', { projectId, relativePath })) as ProjectImage
    },
    staleTime: Infinity,
  })
}

/**
 * Картинка с сайта - только когда человек разрешил (enabled): грузит главный процесс,
 * окно в сеть не ходит. Одна на окно по адресу.
 */
export const useWebImage = (url: string, enabled: boolean) =>
  useQuery({
    queryKey: QUERY_KEYS.webImage(url),
    queryFn: (): Promise<WebImageRead> => invoke('preview:readWebImage', { url }),
    staleTime: Infinity,
    enabled,
  })

/**
 * Изменения на диске - перечитать картинки просмотра, которых они касаются: по пути и по
 * настоящему пути (картинка - ссылка внутри проекта). Человек пересохранил скриншот -
 * просмотр показывает новый; пачка без списка (git checkout) перечитывает видимые, и
 * прежние отвечают unchanged. Подключается в синхронизации редактора (useEditorSync).
 */
export const usePreviewImageSync = () => {
  const queryClient = useQueryClient()

  useIpcEvent('fs:changed', ({ projectId, files }) => {
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.projectImages(projectId),
      predicate: ({ queryKey, state }) => {
        const path = queryKey[3]
        const image = state.data as ProjectImage | undefined
        const realPath = image?.kind === 'image' ? image.realPath : null

        return (
          (typeof path === 'string' && isTouched(path, files)) ||
          (realPath !== null && isTouched(realPath, files))
        )
      },
    })
  })
}
