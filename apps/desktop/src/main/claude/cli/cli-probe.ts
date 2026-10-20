import { homedir } from 'node:os'

import type { ClaudeCli } from './cli-locator'
import { CliProcess } from './cli-process'
import { PROBE_TIMEOUT_MS, CLI_ENV_OVERRIDES } from './cli.constants'

/**
 * Один управляющий запрос к CLI без разговора: процесс поднимается, отвечает и
 * гасится. Сообщения нет - к модели никто не обращается, токены не тратятся. Так панель
 * узнаёт каталог моделей до первого хода, а не показывает свой список. Хуки и плагины
 * человека в таком процессе не нужны - флаг --safe-mode их выключает, если CLI его
 * знает. null - CLI не ответил.
 */
export const askCli = (cli: ClaudeCli, request: Record<string, unknown>): Promise<unknown> =>
  new Promise((resolve) => {
    let isSettled = false
    const settle = (reply: unknown) => {
      if (isSettled) return

      isSettled = true
      clearTimeout(timer)
      process.kill()
      resolve(reply)
    }
    const process: CliProcess = new CliProcess(
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
        cwd: homedir(),
        env: { ...cli.env, ...CLI_ENV_OVERRIDES },
      },
      { onMessage: () => undefined, onControlRequest: () => undefined, onExit: () => settle(null) },
    )
    const timer = setTimeout(() => settle(null), PROBE_TIMEOUT_MS)

    process.control(request).then(settle, () => settle(null))
  })
