import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import { repositoryName } from './git-output'
import { gitAction } from './git-runner'
import { GIT_CLONE_TIMEOUT_MS } from './git.constants'

type CloneResult = { ok: true; rootPath: string } | { ok: false; details: string }

const exists = async (path: string) => {
  try {
    await stat(path)

    return true
  } catch {
    return false
  }
}

/**
 * Клонирует репозиторий в новую папку внутри parentPath (имя - как у репозитория).
 * Существующую папку не трогает. `--` перед адресом: адрес не станет опцией git.
 */
export const cloneRepository = async (url: string, parentPath: string): Promise<CloneResult> => {
  const name = repositoryName(url)

  if (!name || url.trim().startsWith('-')) {
    return { ok: false, details: `"${url}" does not look like a repository address.` }
  }

  if (!(await exists(parentPath))) {
    return { ok: false, details: `Folder ${parentPath} does not exist.` }
  }

  const rootPath = join(parentPath, name)

  if (await exists(rootPath)) {
    return { ok: false, details: `Folder ${rootPath} already exists.` }
  }

  const result = await gitAction(
    parentPath,
    ['clone', '--', url.trim(), rootPath],
    GIT_CLONE_TIMEOUT_MS,
  )

  return result.ok ? { ok: true, rootPath } : result
}
