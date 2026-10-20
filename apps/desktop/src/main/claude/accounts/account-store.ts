import { isAbsolute } from 'node:path'

/** Аккаунт на диске: где его хранилище входа и что о нём известно. */
export type StoredAccount = {
  id: string
  /** Абсолютный путь хранилища. Не переименовывать: имя записи в Keychain - хеш пути. */
  drawer: string
  alias: string
  email: string
  /**
   * Организация аккаунта: почта и она вместе называют аккаунт (accountKey). Пусто - запись
   * старше этого поля; круг экрана аккаунтов допишет её со слов самого хранилища.
   */
  orgUuid: string
  plan: string
  addedAt: number
  /** Хранилище amazing-claude-code: его не удаляем, только ссылаемся. */
  external: boolean
}

export type StoredAccounts = {
  current: string
  accounts: StoredAccount[]
  /**
   * Имя, которое человек дал обычному входу Claude Code: записи у того нет, а имя есть -
   * и склейка дубля переносит на него имя убранной строки.
   */
  defaultAlias: string
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/**
 * Реестр аккаунтов с диска. Запись без абсолютного пути хранилища отбрасывается:
 * относительный путь CLI понял бы от папки проекта и положил бы вход в репозиторий.
 */
export const parseStoredAccounts = (value: unknown): StoredAccounts => {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const accounts = (Array.isArray(record['accounts']) ? record['accounts'] : [])
    .map((item: unknown): StoredAccount | null => {
      if (typeof item !== 'object' || item === null) return null

      const entry = item as Record<string, unknown>
      const id = text(entry['id'])
      const drawer = text(entry['drawer'])

      if (!/^[0-9a-f]{16}$/.test(id) || !isAbsolute(drawer)) return null

      return {
        id,
        drawer,
        alias: text(entry['alias']),
        email: text(entry['email']),
        orgUuid: text(entry['orgUuid']),
        plan: text(entry['plan']),
        addedAt: typeof entry['addedAt'] === 'number' ? entry['addedAt'] : 0,
        external: entry['external'] === true,
      }
    })
    .filter((account) => account !== null)
  const current = text(record['current'])

  return {
    current: accounts.some((account) => account.id === current) ? current : '',
    accounts,
    defaultAlias: text(record['defaultAlias']),
  }
}
