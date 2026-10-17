import { useWorkspaceActions } from '../../state/workspace.queries'
import type { ProjectAction } from './project-actions.types'
import { useProjectsStore } from './projects.store'

/**
 * Запуск действия с проектами откуда угодно: из меню проекта и из поиска везде.
 * Создание и открытие - системные диалоги главного процесса, клонирование - свой
 * диалог, который рисует ProjectSwitcher.
 */
export const useProjectActionRunner = () => {
  const { newProject, openProject } = useWorkspaceActions()
  const openClone = useProjectsStore((state) => state.openClone)

  return (action: ProjectAction) => {
    if (action === 'new') newProject()
    else if (action === 'open') openProject()
    else openClone()
  }
}
