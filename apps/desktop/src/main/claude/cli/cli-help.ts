import { execFile } from 'node:child_process'

import type { ClaudeCli } from './cli-locator'
import { CLI_PROBE_TIMEOUT_MS } from './cli.constants'

const helpByBinary = new Map<string, Promise<string>>()

/**
 * Справка CLI (`--help`) один раз на файл - по ней разовые запуски (поиск модели по
 * разговорам) берут только знакомые флаги: незнакомый CLI не прощает, процесс не
 * стартует вовсе. Пустая строка - CLI не ответил.
 */
export const cliHelp = (cli: ClaudeCli): Promise<string> => {
  let help = helpByBinary.get(cli.binary)

  if (!help) {
    help = new Promise<string>((resolve) =>
      execFile(
        cli.binary,
        ['--help'],
        { env: cli.env, timeout: CLI_PROBE_TIMEOUT_MS, encoding: 'utf8' },
        (_error, stdout) => resolve(stdout),
      ),
    )
    helpByBinary.set(cli.binary, help)
  }

  return help
}
