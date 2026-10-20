import { execFile } from 'node:child_process'
import { rm, chmod, readFile, writeFile } from 'node:fs/promises'

import { OUTRANKING, DRAWER_VARIABLE } from './account-env'

/** Строка для shell в одинарных кавычках: внутри ничего не раскрывается. */
export const quote = (value: string) => `'${value.split("'").join(`'\\''`)}'`

/**
 * Скрипт входа для Терминала: окружение аккаунта и `claude auth login`. Вход в CLI
 * интерактивный (браузер, SSO, код), поэтому идёт в настоящем терминале, а панель ждёт,
 * пока хранилище скажет «вошёл». Окружение - строками скрипта, а не префиксом команды
 * в чужой оболочке: ошибка в кавычках молча вошла бы в хранилище по умолчанию. Номер
 * процесса - в pidFile (exec его сохраняет): отменённый вход панель гасит сама, иначе
 * доведённый в Терминале вход лёг бы в хранилище, которого уже нет.
 */
export const signInScript = (binary: string, drawer: string | null, pidFile: string): string =>
  [
    '#!/bin/zsh',
    drawer === null ? `unset ${DRAWER_VARIABLE}` : `export ${DRAWER_VARIABLE}=${quote(drawer)}`,
    ...(drawer === null ? [] : OUTRANKING.map((name) => `export ${name}=''`)),
    `echo $$ > ${quote(pidFile)}`,
    `exec ${quote(binary)} auth login`,
    '',
  ].join('\n')

/** Записать скрипт входа и сделать исполняемым: Терминал запускает .command как есть. */
export const writeSignInScript = async (
  file: string,
  binary: string,
  drawer: string | null,
  pidFile: string,
) => {
  await rm(pidFile, { force: true })
  await writeFile(file, signInScript(binary, drawer, pidFile), { mode: 0o700 })
  await chmod(file, 0o700)
}

/** Командная строка процесса - чтобы не погасить чужой процесс с тем же номером. */
const commandOf = (pid: number) =>
  new Promise<string>((done) => {
    execFile('ps', ['-p', String(pid), '-o', 'command='], (_error, stdout) => done(stdout.trim()))
  })

/** Погасить вход, который ещё ждёт в Терминале: человек отменил или время вышло. */
export const stopSignInTerminal = async (pidFile: string): Promise<void> => {
  const pid = Number((await readFile(pidFile, 'utf8').catch(() => '')).trim())

  await rm(pidFile, { force: true })

  if (!Number.isInteger(pid) || pid <= 0) return
  if (!(await commandOf(pid)).includes('auth login')) return

  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // Уже закрылся.
  }
}
