import { spawn } from 'node:child_process'

import { GIT_ENV_OVERRIDES, GIT_STDERR_KEEP_CHARS } from './git.constants'

/** Чем кончилась потоковая команда: сама или её остановили мы. */
export type GitStreamOutcome =
  { kind: 'finished'; exitCode: number | null; stderr: string } | { kind: 'stopped' }

type GitStreamOptions = {
  /** Кусок stdout. false - хватит: процесс гасится, итог - stopped. */
  onData: (chunk: Buffer) => boolean
  /** Отмена или таймаут: процесс гасится, итог - stopped. */
  signal: AbortSignal
  env?: Record<string, string>
}

/**
 * Команда git с выводом потоком. В отличие от execFile, вывод не копится целиком:
 * поиск по огромному репозиторию разбирается на лету и гасит git, как только
 * набрал своё. Не запустился (нет git, нет папки) - исключение.
 */
export const streamGit = (
  cwd: string,
  args: string[],
  { onData, signal, env = GIT_ENV_OVERRIDES }: GitStreamOptions,
): Promise<GitStreamOutcome> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      resolve({ kind: 'stopped' })

      return
    }

    const child = spawn('git', args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stopped = false
    let failure: Error | null = null
    let stderr = ''

    const stop = () => {
      if (stopped) return
      stopped = true
      child.kill()
    }

    signal.addEventListener('abort', stop, { once: true })

    child.stdout.on('data', (chunk: Buffer) => {
      if (stopped) return

      // Исключение в обработчике события уронило бы весь главный процесс - отдаём
      // его вызывающему через промис.
      try {
        if (!onData(chunk)) stop()
      } catch (error) {
        failure = error instanceof Error ? error : new Error('Разбор вывода git упал')
        stop()
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < GIT_STDERR_KEEP_CHARS) stderr += chunk.toString()
    })
    child.on('error', (error) => {
      signal.removeEventListener('abort', stop)
      reject(error)
    })
    child.on('close', (exitCode) => {
      signal.removeEventListener('abort', stop)

      if (failure !== null) reject(failure)
      else resolve(stopped ? { kind: 'stopped' } : { kind: 'finished', exitCode, stderr })
    })
  })
