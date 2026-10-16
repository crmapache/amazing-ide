import { useTranslation } from 'react-i18next'

import type { GitBranchKind, GitActionResult } from '@shared/git'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'
import { useGitNoticeStore } from './git-notice.store'

/**
 * Ветка проекта. Перечитывается при возврате в окно: ветку часто переключают в
 * терминале, и шапка не должна врать. Слежение за .git придёт с вотчером диска.
 */
export const useGitHead = (projectId: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.gitHead(projectId ?? ''),
    queryFn: () => invoke('git:getHead', { projectId: projectId ?? '' }),
    enabled: projectId !== undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: 'always',
  })

/** Ветки - когда открыто меню ветки, и каждый раз заново. */
export const useGitBranches = (projectId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.gitBranches(projectId),
    queryFn: () => invoke('git:listBranches', { projectId }),
    staleTime: 0,
  })

/** Что уйдёт при push - для окна подтверждения, пока оно открыто. */
export const usePushInfo = (projectId: string, enabled: boolean) =>
  useQuery({
    queryKey: QUERY_KEYS.gitPushInfo(projectId),
    queryFn: () => invoke('git:getPushInfo', { projectId }),
    enabled,
    staleTime: 0,
  })

/** Одно действие git: запустить, после - перечитать, что могло поменяться. */
const useGitAction = <Input>(
  run: (input: Input) => Promise<GitActionResult>,
  refresh: () => Promise<unknown>,
) => useMutation({ mutationFn: run, onSettled: refresh })

/**
 * Действия git над проектом. После любого - перечитать ветку, ветки и сведения для
 * push, а после тех, что меняют файлы на диске, - и дерево файлов. Итог
 * возвращается тому, кто звал: диалоги показывают ошибку у себя.
 */
export const useGitActions = (projectId: string) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const show = useGitNoticeStore((state) => state.show)

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gitHead(projectId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gitBranches(projectId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gitPushInfo(projectId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectDirectories(projectId) }),
    ])

  const switchBranch = useGitAction(
    ({ branch, kind }: { branch: string; kind: GitBranchKind }) =>
      invoke('git:switchBranch', { projectId, branch, kind }),
    refresh,
  )
  const createBranch = useGitAction(
    (name: string) => invoke('git:createBranch', { projectId, name }),
    refresh,
  )
  const checkoutRevision = useGitAction(
    (revision: string) => invoke('git:checkoutRevision', { projectId, revision }),
    refresh,
  )
  const pull = useGitAction(() => invoke('git:pull', { projectId }), refresh)
  const push = useGitAction(() => invoke('git:push', { projectId }), refresh)

  /** Переключение из меню: неудача - в угол окна, успех виден по шапке. */
  const switchTo = async (branch: string, kind: GitBranchKind) => {
    const result = await switchBranch.mutateAsync({ branch, kind })

    if (!result.ok)
      show({ tone: 'danger', title: t('git.switchFailed', { branch }), details: result.details })
  }

  /** Update Project: итог в угол окна в любом случае - в шапке его не видно. */
  const update = async () => {
    const result = await pull.mutateAsync()

    show(
      result.ok
        ? { tone: 'success', title: t('git.updated'), details: result.summary }
        : { tone: 'danger', title: t('git.updateFailed'), details: result.details },
    )
  }

  return { switchTo, update, createBranch, checkoutRevision, push, isBusy: pull.isPending }
}
