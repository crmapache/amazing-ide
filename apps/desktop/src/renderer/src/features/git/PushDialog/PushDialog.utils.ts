import type { TFunction } from 'i18next'

import type { GitPushInfo } from '@shared/git'

/** Что произойдёт при push - одной фразой для окна подтверждения. */
export const describePush = (info: GitPushInfo | null | undefined, t: TFunction): string => {
  if (!info) return t('git.pushNotOnBranch')
  if (info.upstream)
    return t('git.pushCommits', {
      count: info.ahead ?? 0,
      branch: info.branch,
      upstream: info.upstream,
    })
  if (info.remote) return t('git.pushPublish', { branch: info.branch, remote: info.remote })

  return t('git.pushNoRemote')
}

/** Пушить есть что и куда. */
export const canPush = (info: GitPushInfo | null | undefined): boolean =>
  Boolean(info && (info.upstream ? (info.ahead ?? 0) > 0 : info.remote))
