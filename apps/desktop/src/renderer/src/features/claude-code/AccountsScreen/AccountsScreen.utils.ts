import type { TFunction } from 'i18next'

import type { ClaudeAccount } from '@shared/claude-accounts'

/** Имя аккаунта: данное человеком, иначе почта (её часть до @), иначе «вход по умолчанию». */
export const accountTitle = (account: ClaudeAccount, t: TFunction): string =>
  account.alias ||
  account.email.split('@')[0] ||
  (account.id === '' ? t('claudeCode.accounts.defaultTitle') : t('claudeCode.accounts.untitled'))
