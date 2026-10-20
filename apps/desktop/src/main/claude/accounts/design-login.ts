import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { PanelTerminalCommand } from '@shared/claude-panel'

import { OUTRANKING, DRAWER_VARIABLE } from './account-env'
import { quote } from './sign-in'

/**
 * Команда CLI в Терминале, в хранилище аккаунта в работе (как в ACC): `/design-login` -
 * свой экран, браузер, код, - и `/logout`. Потоковый CLI их не отдаёт вовсе, поэтому
 * Терминал. Хранилище обязательно: credential Claude Design лежит рядом с обычным входом
 * и ездит с переменной хранилища, а выход в чужой оболочке закончил бы чужой аккаунт.
 * Команда - первым промптом сессии.
 */
export const terminalCommandScript = (
  binary: string,
  drawer: string | null,
  command: PanelTerminalCommand,
): string =>
  [
    '#!/bin/zsh',
    drawer === null ? `unset ${DRAWER_VARIABLE}` : `export ${DRAWER_VARIABLE}=${quote(drawer)}`,
    ...(drawer === null ? [] : OUTRANKING.map((name) => `export ${name}=''`)),
    `exec ${quote(binary)} /${command}`,
    '',
  ].join('\n')

/** Записать скрипт рядом с хранилищами и отдать путь для Терминала. */
export const writeTerminalCommand = async (
  dir: string,
  binary: string,
  drawer: string | null,
  command: PanelTerminalCommand,
): Promise<string> => {
  const file = join(dir, `${command}.command`)

  await mkdir(dir, { recursive: true, mode: 0o700 })
  await writeFile(file, terminalCommandScript(binary, drawer, command), { mode: 0o700 })
  await chmod(file, 0o700)

  return file
}
