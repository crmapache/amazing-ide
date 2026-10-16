import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'

/**
 * Клонирование репозитория в новую папку и открытие её проектом. Итог возвращается
 * тому, кто звал: диалог клонирования показывает ошибку git у себя.
 */
export const useCloneProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ url, parentPath }: { url: string; parentPath: string }) =>
      invoke('workspace:cloneProject', { url, parentPath }),
    onSuccess: (result) => {
      if (result.ok) queryClient.setQueryData(QUERY_KEYS.workspace, result.state)
    },
  })
}

/** Системный выбор папки - для поля «куда» в диалогах. */
export const pickFolder = (defaultPath: string) => invoke('dialog:pickFolder', { defaultPath })
