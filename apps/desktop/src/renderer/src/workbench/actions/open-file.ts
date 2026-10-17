import { useQueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '../../state/query-keys'
import { useSelectionStore } from '../../state/selection.store'
import { useActiveProject } from '../../state/workspace.queries'
import { useFileTreeStore } from '../../features/file-tree/file-tree.store'

/**
 * Открыть файл активного проекта, выбранный не в дереве (поиском): выбрать его для
 * редактора и раскрыть дерево до него - дерево само прокрутится к выбранной строке.
 * Каталоги дерева перечитываются: поиск знает файлы, созданные уже после того, как
 * дерево прочитало их папку (слежения за диском пока нет), а строка должна найтись.
 */
export const useOpenFile = () => {
  const queryClient = useQueryClient()
  const project = useActiveProject()
  const selectFile = useSelectionStore((state) => state.selectFile)
  const revealPath = useFileTreeStore((state) => state.revealPath)

  return (relativePath: string) => {
    if (!project) return

    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectDirectories(project.id) })
    revealPath(project.id, relativePath)
    selectFile(project.id, relativePath)
  }
}
