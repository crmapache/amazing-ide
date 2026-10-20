import type { ClaudeCli } from '../cli/cli-locator'
import { CliProcess } from '../cli/cli-process'
import { environmentFor, DRAWER_VARIABLE } from './account-env'
import { CONFIG_VARIABLE } from './accounts.constants'

/**
 * Процесс CLI для вопроса без разговора в СВОЁМ конфиге (`CLAUDE_CONFIG_DIR`): кто
 * вошёл и какой расход. Общий ~/.claude.json называет того, чей процесс писал его
 * последним, и держит его же кэш расхода - чужому аккаунту там нечего брать. Хранилище
 * входа - аккаунта; у обычного входа переменная хранилища - пустая строка: в своём
 * конфиге её отсутствие отправило бы CLI искать вход внутри него. Разговора нет, к
 * модели никто не обращается; хуки и плагины выключены (--safe-mode), если CLI его знает.
 */
export const isolatedCli = (cli: ClaudeCli, drawer: string | null, configDir: string) =>
  new CliProcess(
    {
      binary: cli.binary,
      args: [
        '-p',
        '--verbose',
        '--input-format',
        'stream-json',
        '--output-format',
        'stream-json',
        ...(cli.features.safeMode ? ['--safe-mode'] : []),
      ],
      cwd: configDir,
      env: {
        ...environmentFor(cli.env, drawer),
        [CONFIG_VARIABLE]: configDir,
        ...(drawer === null ? { [DRAWER_VARIABLE]: '' } : {}),
      },
    },
    { onMessage: () => undefined, onControlRequest: () => undefined, onExit: () => undefined },
  )
