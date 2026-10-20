import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, isAbsolute } from 'node:path'

import type { ImportableAccount } from '@shared/claude-accounts'

import { isRecord, stringField, recordsField } from '../cli/cli-messages'

/** Аккаунт ACC: что показать, где его хранилище и организация (у ACC записи её несут). */
export type AccAccount = ImportableAccount & { drawer: string; orgUuid: string }

/** Реестр amazing-claude-code: общий на машину, мы его только читаем. */
const ACC_REGISTRY = join(homedir(), '.amazing-claude-code', 'accounts.json')

/** Аккаунты ACC из его реестра. Черновики (идёт вход) и записи без хранилища - мимо. */
export const parseAccAccounts = (value: unknown): AccAccount[] =>
  (isRecord(value) ? recordsField(value, 'accounts') : [])
    .map((account) => ({
      sourceId: stringField(account, 'id'),
      drawer: stringField(account, 'storeDir'),
      alias: stringField(account, 'alias'),
      email: stringField(account, 'email'),
      orgUuid: stringField(account, 'orgUuid'),
      plan: stringField(account, 'plan'),
    }))
    .filter(
      (account) =>
        account.sourceId && !account.sourceId.startsWith('pending-') && isAbsolute(account.drawer),
    )

/**
 * Аккаунты, заведённые в amazing-claude-code: их хранилища входа можно взять как есть,
 * без повторного входа. Нет ACC или реестр не читается - пусто.
 */
export const readAccAccounts = async (): Promise<AccAccount[]> => {
  try {
    return parseAccAccounts(JSON.parse(await readFile(ACC_REGISTRY, 'utf8')) as unknown)
  } catch {
    return []
  }
}
