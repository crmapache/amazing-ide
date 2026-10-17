import type { GitAction } from './git-actions.types'
import { useGitDialogsStore } from './git-dialogs.store'
import { useGitActions } from './git.queries'

/**
 * Запуск действия git откуда угодно: из меню ветки и из поиска везде. Update Project
 * идёт сразу (итог - в углу окна), остальное открывает свой диалог, который рисует
 * BranchSwitcher. isBusy - идёт pull: пока он идёт, действия git не предлагаются нигде.
 */
export const useGitActionRunner = (projectId: string) => {
  const git = useGitActions(projectId)
  const openDialog = useGitDialogsStore((state) => state.openDialog)

  const run = (action: GitAction) => {
    if (action === 'update') void git.update()
    else openDialog(action)
  }

  return { run, isBusy: git.isBusy }
}
