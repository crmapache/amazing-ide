import type { ParseKeys } from 'i18next'

import type { AccountOutcome } from '@shared/claude-accounts'
import type { AccountCapability } from '@shared/claude-panel'

/** Чем кончилось действие со входом - словами и тоном под шапкой. */
export const OUTCOME_VIEWS: Record<AccountOutcome, { tone: 'info' | 'danger'; key: ParseKeys }> = {
  landed: { tone: 'info', key: 'claudeCode.accounts.landed' },
  timeout: { tone: 'danger', key: 'claudeCode.accounts.timeout' },
  twin: { tone: 'danger', key: 'claudeCode.accounts.twin' },
  cancelled: { tone: 'info', key: 'claudeCode.accounts.cancelled' },
  'open-failed': { tone: 'danger', key: 'claudeCode.accounts.openFailed' },
  'logout-failed': { tone: 'danger', key: 'claudeCode.accounts.logoutFailed' },
  'design-no-account': { tone: 'danger', key: 'claudeCode.accounts.designNoAccount' },
}

/**
 * Ответы пробы, при которых второй аккаунт здесь не завести, и почему - словами: CLI не
 * слушает переменную хранилища, нет ни одного входа, вход по ключу API перебивает любой.
 */
export const UNAVAILABLE_KEYS: Partial<Record<AccountCapability, ParseKeys>> = {
  ignored: 'claudeCode.accounts.unavailable.ignored',
  not_signed_in: 'claudeCode.accounts.unavailable.notSignedIn',
  api_key: 'claudeCode.accounts.unavailable.apiKey',
}
