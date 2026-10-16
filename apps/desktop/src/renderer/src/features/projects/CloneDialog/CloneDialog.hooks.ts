import { useState } from 'react'

import { pickFolder, useCloneProject } from '../projects.queries'
import { parentFolder } from '../projects.utils'
import { useAppInfo } from '../../../state/app-info.queries'
import { useActiveProject } from '../../../state/workspace.queries'

/**
 * Состояние диалога клонирования: адрес, папка назначения (по умолчанию - рядом с
 * активным проектом, без проекта - «Документы»), запуск и ошибка git.
 */
export const useCloneForm = (onDone: () => void) => {
  const { data: appInfo } = useAppInfo()
  const project = useActiveProject()
  const clone = useCloneProject()
  const [url, setUrl] = useState('')
  const [chosenFolder, setChosenFolder] = useState<string | null>(null)
  const folder =
    chosenFolder ?? (project ? parentFolder(project.rootPath) : (appInfo?.documentsDir ?? ''))
  const error = clone.data && !clone.data.ok ? clone.data.details : undefined

  const reset = () => {
    setUrl('')
    setChosenFolder(null)
    clone.reset()
  }

  const submit = async () => {
    if (url.trim() === '' || clone.isPending) return

    const result = await clone.mutateAsync({ url, parentPath: folder })

    if (result.ok) {
      reset()
      onDone()
    }
  }

  const browse = async () => {
    const picked = await pickFolder(folder)

    if (picked) setChosenFolder(picked)
  }

  return { url, setUrl, folder, error, isCloning: clone.isPending, submit, browse, reset }
}
