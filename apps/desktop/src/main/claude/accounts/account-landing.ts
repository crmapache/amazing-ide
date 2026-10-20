import type { ClaudeCli } from '../cli/cli-locator'
import type { StoredAccount } from './account-store'
import type { Holds } from './account-twins'
import { holdsOf, filedKey } from './account-twins'
import type { AuthStatus } from './auth-status'
import type { AccountIdentity } from './identity-probe'
import { accountKey, probeIdentity } from './identity-probe'

/**
 * Куда лёг новый вход (completeSignIn в ACC). twin - это аккаунт обычного входа: черновик
 * уходит, человек ничего не теряет. renew - повторный вход в аккаунт из списка: хранилище
 * записи сменится на новое, старое уходит. add - новая строка; refile - запись, чьё
 * хранилище держит другого, переписывается под настоящее имя и остаётся рядом.
 */
export type Landing =
  | { kind: 'twin' }
  | { kind: 'renew'; held: string; who: AccountIdentity }
  | { kind: 'add'; who: AccountIdentity; refile: { id: string; who: AccountIdentity } | null }

/** Что решению нужно снаружи: реестр, вопрос «вошёл ли» и папка одноразовых проб. */
export type LandingHost = {
  dir: string
  records: () => readonly StoredAccount[]
  statusOf: (drawer: string | null) => Promise<AuthStatus | null>
}

/** Что держит хранилище записи - вопросом к нему самому. Не ответил вовсе - unknown. */
export const whoHolds = async (
  cli: ClaudeCli,
  host: LandingHost,
  record: StoredAccount,
  asked: AccountIdentity | null,
): Promise<Holds> => {
  const status = await host.statusOf(record.drawer)

  // Без authMethod CLI не ответил (сбой, таймаут): это не «пусто».
  if (!status?.method) return { kind: 'unknown' }

  const who = status.loggedIn ? await probeIdentity(cli, record.drawer, host.dir) : null

  return holdsOf(status.loggedIn, who, filedKey(record, asked ?? who))
}

/**
 * Решить, куда лёг вход в черновик; null - хранилище ещё не сказало, чей вход (спросим на
 * следующем шаге опроса). Кто вошёл - только ответ самих хранилищ (identity-probe.ts), а не
 * общий конфиг. Хранилище, записанное под тот же аккаунт, меняется, только если само сказало,
 * что держит его или пусто: метка записи - то, что сказали входу тогда, и она бывала неверной.
 */
export const landingOf = async (
  cli: ClaudeCli,
  host: LandingHost,
  draft: StoredAccount,
): Promise<Landing | null> => {
  const who = await probeIdentity(cli, draft.drawer, host.dir)

  if (!who) return null

  const key = accountKey(who.email, who.orgUuid)
  const defaultWho = await probeIdentity(cli, null, host.dir)

  if (defaultWho && accountKey(defaultWho.email, defaultWho.orgUuid) === key)
    return { kind: 'twin' }

  const held = host
    .records()
    .find((record) => record.drawer !== draft.drawer && filedKey(record, who) === key)

  if (!held) return { kind: 'add', who, refile: null }

  const holds = await whoHolds(cli, host, held, who)

  if (holds.kind === 'same' || holds.kind === 'nobody') return { kind: 'renew', held: held.id, who }

  // Чужой - переписать под настоящее имя; не сказал чей - оставить обе: круг разберёт сам.
  return {
    kind: 'add',
    who,
    refile: holds.kind === 'another' ? { id: held.id, who: holds.who } : null,
  }
}
