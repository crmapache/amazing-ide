import { X, Files, History, Sparkles, ArrowRightLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLayoutStore } from '../../state/layout.store'
import { useWorkspace, useActiveProject, useWorkspaceActions } from '../../state/workspace.queries'
import {
  GIT_BRANCH_ACTIONS,
  GIT_REPOSITORY_ACTIONS,
} from '../../features/git/git-actions.constants'
import { useGitActionRunner } from '../../features/git/git-actions.hooks'
import { availableActions } from '../../features/git/git-actions.utils'
import { useGitHead } from '../../features/git/git.queries'
import { PROJECT_ACTIONS } from '../../features/projects/project-actions.constants'
import { useProjectActionRunner } from '../../features/projects/project-actions.hooks'
import type { SearchAction } from '../../features/search-everywhere/search-everywhere.types'

/**
 * Действия IDE для поиска везде. Собраны здесь, а не в поиске: им нужны проекты, git
 * и раскладка сразу, а связывать фичи между собой - дело workbench. Действия проекта
 * и git берутся из тех же описаний, что рисуют их меню: подпись и иконка не разойдутся.
 * Действия git - только у репозитория и не во время pull, переход в проект - только к
 * не активному.
 */
export const useIdeActions = (): SearchAction[] => {
  const { t } = useTranslation()
  const { data: workspace } = useWorkspace()
  const project = useActiveProject()
  const { data: head } = useGitHead(project?.id)
  const { closeProject, activateProject, openRecentProject } = useWorkspaceActions()
  const runProjectAction = useProjectActionRunner()
  const gitRunner = useGitActionRunner(project?.id ?? '')
  const selectSideView = useLayoutStore((state) => state.selectSideView)
  const selectProviderView = useLayoutStore((state) => state.selectProviderView)

  const projectActions: SearchAction[] = PROJECT_ACTIONS.map((entry) => ({
    id: `project.${entry.id}`,
    label: t(entry.labelKey),
    icon: entry.icon,
    shortcut: entry.shortcut,
    keywords: entry.keywords,
    run: () => runProjectAction(entry.id),
  }))

  const workspaceActions: SearchAction[] = [
    ...(project
      ? [
          {
            id: 'project.close',
            label: t('searchEverywhere.actions.closeProject', { name: project.name }),
            icon: X,
            run: () => closeProject(project.id),
          },
        ]
      : []),
    ...(workspace?.projects ?? [])
      .filter((other) => other.id !== project?.id)
      .map((other) => ({
        id: `project.switch:${other.id}`,
        label: t('searchEverywhere.actions.switchProject', { name: other.name }),
        icon: ArrowRightLeft,
        run: () => activateProject(other.id),
      })),
  ]

  // Пока идёт pull, ни переключать ветку, ни пушить нельзя: pull потом перемотал бы
  // уже новый HEAD. Меню ветки в это время заблокировано, поиск ведёт себя так же.
  const gitActions: SearchAction[] =
    head && !gitRunner.isBusy
      ? availableActions([...GIT_REPOSITORY_ACTIONS, ...GIT_BRANCH_ACTIONS]).map((entry) => ({
          id: `git.${entry.id}`,
          label: t(entry.labelKey),
          icon: entry.icon,
          keywords: entry.keywords,
          run: () => gitRunner.run(entry.id),
        }))
      : []

  const viewActions: SearchAction[] = [
    {
      id: 'view.files',
      label: t('searchEverywhere.actions.toggleFiles'),
      icon: Files,
      run: () => selectSideView('files'),
    },
    {
      id: 'view.claudeCode',
      label: t('searchEverywhere.actions.toggleClaudeCode'),
      icon: Sparkles,
      run: () => selectProviderView('claude-code'),
    },
  ]

  const recentActions: SearchAction[] = (workspace?.recentProjects ?? []).map((recent) => ({
    id: `project.recent:${recent.rootPath}`,
    label: t('searchEverywhere.actions.openRecent', { name: recent.name }),
    icon: History,
    run: () => openRecentProject(recent.rootPath),
  }))

  return [...projectActions, ...workspaceActions, ...gitActions, ...viewActions, ...recentActions]
}
