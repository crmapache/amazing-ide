import { useCallback } from 'react'

import type { PathLocation } from '@shared/fs'
import { useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { useLayoutStore } from '../../state/layout.store'
import type { OpenFile, OpenFileOutcome } from '../../state/open-file.context'
import { QUERY_KEYS } from '../../state/query-keys'
import type { FilePlace } from '../../state/selection.store'
import { useSelectionStore } from '../../state/selection.store'
import { useActiveProject } from '../../state/workspace.queries'
import { useFileTreeStore } from '../../features/file-tree/file-tree.store'

const OPENED: OpenFileOutcome = { kind: 'opened' }
const MISSING: OpenFileOutcome = { kind: 'missing' }

/** Место без единого поля - не место: выбор файла без него открывает файл как есть. */
const placeOrNothing = (place: FilePlace): FilePlace | undefined =>
  Object.values(place).some((value) => value !== undefined) ? place : undefined

/**
 * Куда ведёт путь - спрашиваем главный процесс: только он видит диск. Отказ канала
 * (проект успели закрыть) - «нет такого»: клик должен чем-то ответить.
 */
const locate = async (projectId: string, path: string): Promise<PathLocation> => {
  try {
    return await invoke('fs:locatePath', { projectId, path })
  } catch (error) {
    console.warn('[open-file] путь не разрешился:', error)

    return { kind: 'missing' }
  }
}

/**
 * Показать папку - значит открыть левую панель с деревом: просьба, выполненная за
 * спрятанной панелью, не выполнена. Уже открытую не трогаем - повторный выбор вида
 * её бы свернул.
 */
const showFileTree = () => {
  const { side, selectSideView } = useLayoutStore.getState()

  if (side.activeViewId !== 'files' || !side.isOpen) selectSideView('files')
}

/**
 * Открыть путь, названный не в дереве (поиском, лентой Claude Code): файл проекта -
 * выбрать для редактора с местом и раскрыть дерево до него; папку проекта - раскрыть
 * и показать в дереве; что-то вне проекта - отдать системе (fs:openOutside); голое
 * имя в нескольких местах - вернуть кандидатов на выбор. Каталоги дерева
 * перечитываются: файл мог появиться после того, как дерево прочитало папку.
 */
export const useOpenFile = (): OpenFile => {
  const queryClient = useQueryClient()
  const project = useActiveProject()
  const selectFile = useSelectionStore((state) => state.selectFile)
  const revealPath = useFileTreeStore((state) => state.revealPath)

  // Одна функция, пока не сменился проект: её раздаёт контекст, и потребители не
  // должны перерисовываться на каждый рендер раскладки.
  return useCallback(
    async (request) => {
      if (!project) return MISSING

      const { path, ...place } = typeof request === 'string' ? { path: request } : request
      const location = await locate(project.id, path)
      const refreshTree = () =>
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectDirectories(project.id) })

      switch (location.kind) {
        case 'projectFile':
          void refreshTree()
          revealPath(project.id, location.relativePath)
          selectFile(project.id, location.relativePath, placeOrNothing(place))

          return OPENED
        case 'projectFolder':
          void refreshTree()
          revealPath(project.id, location.relativePath, { expand: true })
          showFileTree()

          return OPENED
        case 'outsideFile':
        case 'outsideFolder': {
          const shown = await invoke('fs:openOutside', {
            projectId: project.id,
            path: location.absolutePath,
            reveal: location.kind === 'outsideFolder',
          }).catch(() => false)

          return shown ? OPENED : MISSING
        }
        case 'choose':
          return { kind: 'choose', candidates: location.candidates }
        case 'missing':
          return MISSING
      }
    },
    [project, queryClient, revealPath, selectFile],
  )
}
