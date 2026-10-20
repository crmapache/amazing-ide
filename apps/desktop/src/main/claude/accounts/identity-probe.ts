import { rm, mkdtemp, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import type { ClaudeCli } from '../cli/cli-locator'
import { isRecord, numberField, recordField, stringField } from '../cli/cli-messages'
import { IDENTITY_POLL_MS, IDENTITY_WRITE_MS, IDENTITY_TIMEOUT_MS } from './accounts.constants'
import { isolatedCli } from './isolated-cli'

/** Кто вошёл в хранилище - со слов сервера: почта, организация и id аккаунта. */
export type AccountIdentity = { email: string; orgUuid: string; accountUuid: string }

/**
 * Каким аккаунтом считать запись (как AccountStore.keyOf в ACC): почта и организация.
 * Одна почта в двух организациях - два места, две подписки и два счёта.
 */
export const accountKey = (email: string, orgUuid: string): string =>
  `${email.trim().toLowerCase()}|${orgUuid.trim()}`

/** Профиль, который CLI записал в свой конфиг, - только полученный после вопроса. */
export const identityFrom = (config: unknown, askedAt: number): AccountIdentity | null => {
  const account = isRecord(config) ? recordField(config, 'oauthAccount') : {}
  const email = stringField(account, 'emailAddress')

  if (!email || numberField(account, 'profileFetchedAt') < askedAt) return null

  return {
    email,
    orgUuid: stringField(account, 'organizationUuid'),
    accountUuid: stringField(account, 'accountUuid'),
  }
}

const readIdentity = async (file: string, askedAt: number) =>
  identityFrom(
    await readFile(file, 'utf8')
      .then((text) => JSON.parse(text) as unknown)
      .catch(() => null),
    askedAt,
  )

/**
 * Кто вошёл в хранилище - ответ самого хранилища, а не общего ~/.claude.json: любой
 * работающий разговор может переписать тот посреди входа. Процесс CLI поднимается в
 * одноразовом своём конфиге (isolated-cli.ts) и отвечает на рукопожатие `initialize`:
 * на старте CLI получает профиль этим входом и пишет его в этот конфиг (замер на
 * 2.1.293, как делает ACC). Не get_usage: вопросы о расходе сервер отбивает после
 * трёх-четырёх подряд, и пустели бы цифры на экране. null - не ответил.
 */
export const probeIdentity = async (
  cli: ClaudeCli,
  drawer: string | null,
  tempRoot: string,
): Promise<AccountIdentity | null> => {
  const dir = await mkdtemp(join(tempRoot, 'identity-'))
  const file = join(dir, '.claude.json')
  const askedAt = Date.now()
  const process = isolatedCli(cli, drawer, dir)

  try {
    await Promise.race([process.control({ subtype: 'initialize' }), delay(IDENTITY_TIMEOUT_MS)])

    // Профиль пишется рядом с ответом, не обязательно до него.
    for (let waited = 0; waited <= IDENTITY_WRITE_MS; waited += IDENTITY_POLL_MS) {
      const identity = await readIdentity(file, askedAt)

      if (identity) return identity

      await delay(IDENTITY_POLL_MS)
    }

    return null
  } catch {
    return null
  } finally {
    await process.stop()
    await rm(dir, { recursive: true, force: true })
  }
}
