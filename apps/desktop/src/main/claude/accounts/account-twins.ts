import type { AccountIdentity } from './identity-probe'
import { accountKey } from './identity-probe'

/**
 * Решения о строках экрана аккаунтов (как AccountTwin и ClaudeAccounts.Holds в ACC). Строка -
 * тот аккаунт, который держит её хранилище, а не тот, под которым её записали: запись знает
 * только то, что сказали входу тогда, а хранилище с чужим входом - единственная его копия на
 * машине. Поэтому всё, что удаляет или переписывает, опирается на свежий ответ самого
 * хранилища (identity-probe.ts) и на то, что оно живо прямо сейчас.
 */

/** Что держит хранилище записи, со слов самого хранилища. */
export type Holds =
  /** Тот аккаунт, под которым записано: старая половина повторного входа, менять можно. */
  | { kind: 'same' }
  /** Входа нет вовсе: терять нечего. */
  | { kind: 'nobody' }
  /** Чужой: запись переписывается под настоящее имя и остаётся. */
  | { kind: 'another'; who: AccountIdentity }
  /** Вошёл, но не сказал чей: ничего не удаляется. «Не сказал» - не «пуст». */
  | { kind: 'unknown' }

/** Чей вход в хранилище; filedAs - accountKey записи. Чистая: правило «чужое не удалять» держит тест. */
export const holdsOf = (loggedIn: boolean, who: AccountIdentity | null, filedAs: string): Holds => {
  if (!loggedIn) return { kind: 'nobody' }
  if (!who?.email) return { kind: 'unknown' }

  return accountKey(who.email, who.orgUuid) === filedAs
    ? { kind: 'same' }
    : { kind: 'another', who }
}

/**
 * Под каким аккаунтом запись для сравнения с ответом: у записи старше поля организации (пусто)
 * организация берётся из ответа - её почта и есть всё, что о ней знали.
 */
export const filedKey = (
  record: { email: string; orgUuid: string },
  who: AccountIdentity | null,
): string => accountKey(record.email, record.orgUuid || who?.orgUuid || '')

/**
 * Добавленная строка глазами круга экрана: кто в её хранилище (свежий ответ; null - не
 * спрашивали или не ответил), жива ли она сейчас и под каким аккаунтом записана.
 */
export type TwinRow = {
  id: string
  who: AccountIdentity | null
  live: boolean
  /** accountKey записи (почта и организация, как записаны). */
  filedAs: string
  addedAt: number
  alias: string
}

/** Обычный вход Claude Code: записи у него нет, есть ответ его хранилища и имя от человека. */
export type DefaultRow = { who: AccountIdentity | null; live: boolean }

/** Что убрать, куда перевести всё с неё и какое имя человека встаёт на оставшуюся строку. */
export type TwinMerge = { drop: string; keep: string; alias: string | null }

/** Какой аккаунт держит хранилище - только по свежему ответу живого хранилища. */
const heldKey = (row: { who: AccountIdentity | null; live: boolean }): string | null =>
  row.live && row.who?.email ? accountKey(row.who.email, row.who.orgUuid) : null

/**
 * Добавленные строки, чьё хранилище держит не тот аккаунт, под которым они записаны, - с
 * настоящим владельцем. Переписываются на месте: id, хранилище и разговоры остаются.
 */
export const mislabelled = (rows: readonly TwinRow[]): { id: string; who: AccountIdentity }[] =>
  rows.flatMap((row) => {
    const key = heldKey(row)

    return key && row.who && key !== row.filedAs ? [{ id: row.id, who: row.who }] : []
  })

/** Первое непустое имя человека среди уходящих строк. */
const aliasOf = (rows: readonly TwinRow[]): string | null =>
  rows.find((row) => row.alias.trim())?.alias ?? null

/**
 * Склейки: две строки одного аккаунта (почта и организация, а не одна почта: два места одного
 * человека в двух организациях - два счёта). Строка на аккаунт обычного входа уходит в него -
 * у того нет хранилища, которое можно удалить, и его имя человека перетирается всегда: оно
 * могло быть дано, когда вход держал другой аккаунт. Из добавленных остаётся та, что в работе,
 * иначе более новая, и её имя не перетирается именем уходящей.
 */
export const twinMerges = (
  defaultRow: DefaultRow,
  rows: readonly TwinRow[],
  current: string,
): TwinMerge[] => {
  const groups = new Map<string, TwinRow[]>()

  for (const row of rows) {
    const key = heldKey(row)

    if (key) groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const defaultKey = heldKey(defaultRow)

  return [...groups].flatMap(([key, group]) => {
    if (key === defaultKey) {
      const alias = aliasOf(group)

      return group.map((row) => ({ drop: row.id, keep: '', alias }))
    }

    if (group.length < 2) return []

    const keep =
      group.find((row) => row.id === current) ??
      group.reduce((newest, row) => (row.addedAt > newest.addedAt ? row : newest))
    const dropped = group.filter((row) => row !== keep)
    const alias = keep.alias.trim() ? null : aliasOf(dropped)

    return dropped.map((row) => ({ drop: row.id, keep: keep.id, alias }))
  })
}
