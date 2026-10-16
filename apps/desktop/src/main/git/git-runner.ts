import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { GitActionResult } from '@shared/git'

import { stderrOf, firstLine, summarizeGitError } from './git-output'
import { GIT_ENV_OVERRIDES, GIT_LOCAL_TIMEOUT_MS } from './git.constants'

const run = promisify(execFile)

/** Команда git в папке проекта. Ошибка - исключение execFile с кодом и stderr. */
export const git = (cwd: string, args: string[], timeout = GIT_LOCAL_TIMEOUT_MS) =>
  run('git', args, { cwd, timeout, env: { ...process.env, ...GIT_ENV_OVERRIDES } })

/** То же, но итог - для человека: первая строка ответа или то, что сказал git. */
export const gitAction = async (
  cwd: string,
  args: string[],
  timeout?: number,
): Promise<GitActionResult> => {
  try {
    const { stdout, stderr } = await git(cwd, args, timeout)

    // git пишет ход работы в stderr даже при успехе (switch, push) - берём что есть.
    return { ok: true, summary: firstLine(stdout) || firstLine(stderr) }
  } catch (error) {
    return { ok: false, details: summarizeGitError(stderrOf(error)) }
  }
}

/** Отказ без вызова git: проверка на нашей стороне не прошла. */
export const refuse = (details: string): GitActionResult => ({ ok: false, details })
