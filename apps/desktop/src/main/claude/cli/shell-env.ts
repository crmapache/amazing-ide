import { execFile } from 'node:child_process'
import { homedir, userInfo } from 'node:os'
import { join, delimiter } from 'node:path'

import {
  EXTRA_BIN_DIRS,
  SYSTEM_BIN_DIRS,
  SHELL_ENV_MARKER,
  SHELL_ENV_TIMEOUT_MS,
} from './cli.constants'

export type Environment = Record<string, string>

let shellEnv: Promise<Environment> | null = null

/**
 * Окружение из вывода `env -0` после метки. Значения разделены нулём, а не переводом
 * строки: в значении перевод строки бывает. Мусор профиля до метки отбрасывается.
 */
export const parseShellEnv = (output: string): Environment => {
  const start = output.lastIndexOf(SHELL_ENV_MARKER)

  if (start < 0) return {}

  const environment: Environment = {}

  for (const entry of output.slice(start + SHELL_ENV_MARKER.length).split('\0')) {
    const separator = entry.indexOf('=')
    const name = entry.slice(0, separator).trim()

    if (separator > 0 && name) environment[name] = entry.slice(separator + 1)
  }

  return environment
}

/** Склеивает списки папок PATH без повторов, порядок первого появления сохраняется. */
export const mergePaths = (...paths: (string | undefined)[]): string => {
  const seen = new Set<string>()

  for (const path of paths) {
    for (const dir of path?.split(delimiter) ?? []) if (dir) seen.add(dir)
  }

  return [...seen].join(delimiter)
}

const readLoginShellEnv = () =>
  new Promise<Environment>((resolve) => {
    const shell = process.env['SHELL'] || '/bin/zsh'
    const child = execFile(
      shell,
      ['-ilc', `printf '${SHELL_ENV_MARKER}'; env -0`],
      { timeout: SHELL_ENV_TIMEOUT_MS, env: { ...process.env, TERM: 'dumb' }, encoding: 'utf8' },
      (_error, stdout) => resolve(parseShellEnv(stdout)),
    )

    // Профиль, который чего-то ждёт с клавиатуры, получит конец ввода, а не повиснет.
    child.stdin?.end()
  })

/** Без USER CLI не находит свою запись в связке ключей и считает, что вход не выполнен. */
const withIdentity = (environment: Environment): Environment => {
  const { username, homedir: home } = userInfo()

  return {
    ...environment,
    USER: environment['USER'] || username,
    LOGNAME: environment['LOGNAME'] || username,
    HOME: environment['HOME'] || home,
  }
}

/**
 * Окружение, с которым живёт человек в терминале. Приложение, запущенное из Finder,
 * получает от macOS короткий PATH без Homebrew, nvm и ~/.local/bin: CLI бы не нашёлся,
 * а его Bash не нашёл бы node и git. Оболочка спрашивается один раз за запуск;
 * не ответила - берём окружение процесса и известные папки.
 */
export const loginShellEnv = (): Promise<Environment> => {
  shellEnv ??= readLoginShellEnv().then((fromShell) => {
    const base = { ...(process.env as Environment), ...fromShell }

    return withIdentity({
      ...base,
      PATH: mergePaths(
        fromShell['PATH'],
        process.env['PATH'],
        ...EXTRA_BIN_DIRS.map((dir) => join(homedir(), dir)),
        ...SYSTEM_BIN_DIRS,
      ),
    })
  })

  return shellEnv
}
