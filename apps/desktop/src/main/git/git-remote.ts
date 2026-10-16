import type { GitPushInfo, GitActionResult } from '@shared/git'

import { readHead } from './git-head'
import { parseLines } from './git-output'
import { git, refuse, gitAction } from './git-runner'
import { GIT_NETWORK_TIMEOUT_MS } from './git.constants'

const tryOutput = async (rootPath: string, args: string[]) => {
  try {
    return (await git(rootPath, args)).stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Обновить проект: подтянуть изменения текущей ветки только перемоткой вперёд. Если
 * ветки разошлись, git откажет и ничего не тронет - сливать без окна конфликтов IDE
 * не берётся.
 */
export const pull = (rootPath: string): Promise<GitActionResult> =>
  gitAction(rootPath, ['pull', '--ff-only'], GIT_NETWORK_TIMEOUT_MS)

/** Что сделает push: для окна подтверждения. null - не на ветке. */
export const readPushInfo = async (rootPath: string): Promise<GitPushInfo | null> => {
  const head = await readHead(rootPath)

  if (head?.kind !== 'branch') return null

  const upstream = await tryOutput(rootPath, [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{upstream}',
  ])
  const remotes = parseLines((await tryOutput(rootPath, ['remote'])) ?? '')
  const remote = remotes.includes('origin') ? 'origin' : (remotes[0] ?? null)
  const ahead = upstream
    ? Number(await tryOutput(rootPath, ['rev-list', '--count', '@{upstream}..HEAD']))
    : null

  return {
    branch: head.name,
    upstream,
    remote,
    ahead: ahead !== null && Number.isFinite(ahead) ? ahead : null,
  }
}

/**
 * Отправить текущую ветку. Ветка без upstream публикуется в удалённый репозиторий и
 * начинает его отслеживать. Force push здесь нет и не будет без отдельного решения.
 */
export const push = async (rootPath: string): Promise<GitActionResult> => {
  const info = await readPushInfo(rootPath)

  if (!info) return refuse('Push works only on a branch, not on a detached commit.')
  if (info.upstream) return gitAction(rootPath, ['push'], GIT_NETWORK_TIMEOUT_MS)
  if (!info.remote) return refuse('This repository has no remote to push to.')

  return gitAction(
    rootPath,
    ['push', '--set-upstream', info.remote, info.branch],
    GIT_NETWORK_TIMEOUT_MS,
  )
}
