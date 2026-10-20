import type { ClaudeCli } from '../cli/cli-locator'
import { isRecord, stringField } from '../cli/cli-messages'
import { runCli } from '../tools/cli-run'
import { parseCliJson } from '../tools/plugin-catalog'

/**
 * Кто вошёл в хранилище: вошёл ли и тариф (их CLI говорит честно для каждого хранилища).
 * projectsDirectory - где CLI держит разговоры: по нему проба аккаунтов видит, что
 * переменная хранилища унесла только вход, а не всё (пусто - CLI старше 2.1.247).
 */
export type AuthStatus = {
  loggedIn: boolean
  plan: string
  email: string
  method: string
  projectsDirectory: string
}

/**
 * Разбор `claude auth status --json`. Почта и организация в нём - из общего
 * ~/.claude.json, их пишет последний процесс любого аккаунта: верны сразу после входа,
 * потом - уже нет. Поэтому почту запоминаем в момент входа.
 */
export const parseAuthStatus = (output: string): AuthStatus => {
  const value = parseCliJson(output)
  const record = isRecord(value) ? value : {}

  return {
    loggedIn: record['loggedIn'] === true,
    plan: stringField(record, 'subscriptionType'),
    email: stringField(record, 'email'),
    method: stringField(record, 'authMethod'),
    projectsDirectory: stringField(record, 'projectsDirectory'),
  }
}

export const authStatus = async (cli: ClaudeCli, cwd: string): Promise<AuthStatus> =>
  parseAuthStatus((await runCli(cli, ['auth', 'status', '--json'], cwd)).stdout)
