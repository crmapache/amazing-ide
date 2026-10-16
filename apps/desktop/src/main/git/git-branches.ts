import type { GitBranches, GitBranchKind, GitActionResult } from '@shared/git'

import { parseLines, localNameOf, parseRemoteBranches } from './git-output'
import { git, refuse, gitAction } from './git-runner'

const refs = async (rootPath: string, namespace: string) => {
  const { stdout } = await git(rootPath, ['for-each-ref', '--format=%(refname:short)', namespace])

  return stdout
}

/** Локальные и удалённые ветки по алфавиту. Не репозиторий - пустые списки. */
export const listBranches = async (rootPath: string): Promise<GitBranches> => {
  try {
    const [local, remote] = await Promise.all([
      refs(rootPath, 'refs/heads'),
      refs(rootPath, 'refs/remotes'),
    ])

    return { local: parseLines(local), remote: parseRemoteBranches(remote) }
  } catch {
    return { local: [], remote: [] }
  }
}

/**
 * Переключение через `git switch`. Удалённая ветка без локальной создаёт локальную,
 * которая её отслеживает (как Checkout в WebStorm). Имя берётся только из списка
 * существующих веток: так в git не попадёт ни опция, ни то, чего человек не выбирал.
 * Мешающие незакоммиченные правки git сам не даст затереть.
 */
export const switchBranch = async (
  rootPath: string,
  branch: string,
  kind: GitBranchKind,
): Promise<GitActionResult> => {
  const { local, remote } = await listBranches(rootPath)

  if (kind === 'local') {
    return local.includes(branch)
      ? gitAction(rootPath, ['switch', branch])
      : refuse(`There is no local branch "${branch}".`)
  }

  if (!remote.includes(branch)) return refuse(`There is no remote branch "${branch}".`)

  const localName = localNameOf(branch)

  return local.includes(localName)
    ? gitAction(rootPath, ['switch', localName])
    : gitAction(rootPath, ['switch', '--track', branch])
}

/** Новая ветка от текущего коммита, сразу текущая. Имя проверяет сам git. */
export const createBranch = async (rootPath: string, name: string): Promise<GitActionResult> => {
  const invalid = refuse(`"${name}" is not a valid branch name.`)

  // Ведущий минус git принял бы за опцию - отсекаем до вызова.
  if (name.trim() === '' || name.startsWith('-')) return invalid

  const valid = await gitAction(rootPath, ['check-ref-format', '--branch', name])

  if (!valid.ok) return invalid

  return gitAction(rootPath, ['switch', '--create', name])
}

/**
 * Переход на тег или коммит без ветки (detached HEAD), как Checkout Tag or Revision
 * в WebStorm. Что угодно, что не разбирается в коммит, git не получит.
 */
export const checkoutRevision = async (
  rootPath: string,
  revision: string,
): Promise<GitActionResult> => {
  const unknown = refuse(`"${revision}" is not a tag, branch or commit in this repository.`)

  if (revision.trim() === '' || revision.startsWith('-')) return unknown

  const resolved = await gitAction(rootPath, [
    'rev-parse',
    '--verify',
    '--quiet',
    `${revision}^{commit}`,
  ])

  if (!resolved.ok) return unknown

  return gitAction(rootPath, ['switch', '--detach', revision])
}
