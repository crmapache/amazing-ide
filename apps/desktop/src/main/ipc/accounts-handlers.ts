import type { ClaudeService } from '../claude/claude-service'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'

type AccountChannels = Extract<keyof InvokeHandlers, `accounts:${string}`>

/** Больше аккаунтов за раз окно не спрашивает: столько не бывает на экране. */
const MAX_USAGE_ACCOUNTS = 32

/** id аккаунта: свой (16 hex) или пустой - обычный вход. */
const assertAccountId = (value: unknown): string => {
  assertString(value, 'accountId')

  if (value !== '' && !/^[0-9a-f]{16}$/.test(value)) throw new Error('Недопустимый id аккаунта')

  return value
}

/** Каналы аккаунтов Claude: проверить вход, позвать AccountService, вернуть состояние. */
export const createAccountsHandlers = (
  claude: ClaudeService,
): Pick<InvokeHandlers, AccountChannels> => {
  const { accounts } = claude
  const state = () => claude.getState()

  return {
    'accounts:refresh': async () => {
      await accounts.refresh()
      // Проба «умеет ли CLI два входа», переписывание и склейка - в фоне, не чаще раза в 10 минут.
      void claude.panel.upkeep.run()
      // Каталоги моделей вошедших: переезд на аккаунт поднимет процесс на модели, которую тот может.
      void claude.panel.accountModels.learnAll()

      return state()
    },
    'accounts:refreshUsage': async ({ accountIds }) => {
      if (!Array.isArray(accountIds) || accountIds.length > MAX_USAGE_ACCOUNTS) {
        throw new Error('Ожидался список аккаунтов')
      }

      await claude.usage.refresh(accountIds.map(assertAccountId))

      return state()
    },
    'accounts:add': async () => {
      await accounts.add()

      return state()
    },
    'accounts:signIn': async ({ accountId }) => {
      await accounts.signInAgain(assertAccountId(accountId))

      return state()
    },
    'accounts:cancelSignIn': async () => {
      await accounts.cancelSignIn()

      return state()
    },
    'accounts:select': ({ accountId }) => {
      accounts.select(assertAccountId(accountId))
      // Select по уже текущему тоже переводит всё: вкладка могла отстать на старом входе.
      claude.panel.accountChanged()

      return state()
    },
    'accounts:rename': ({ accountId, alias }) => {
      assertString(alias, 'alias')

      if (alias.length > 80) throw new Error('Слишком длинное имя')

      accounts.rename(assertAccountId(accountId), alias)

      return state()
    },
    'accounts:forget': async ({ accountId }) => {
      await accounts.forget(assertAccountId(accountId))

      return state()
    },
    'accounts:logout': async () => {
      // После выхода - на соседний вошедший аккаунт, а не к экрану входа.
      await claude.panel.logout()

      return state()
    },
    'accounts:import': ({ sourceId }) => {
      assertString(sourceId, 'sourceId')
      accounts.import(sourceId)

      return state()
    },
  }
}
