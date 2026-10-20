import type { ParseKeys } from 'i18next'

import type { StopReason, RetryReason, RetryOutcome } from '@shared/claude-feed'

/** Часы процента компакта и отсчёта повтора. */
export const COMPACT_TICK_MS = 500
export const RETRY_TICK_MS = 1000
export const LIMIT_TICK_MS = 10_000

/**
 * Процент компакта - по часам, а не по работе (CLI говорит только «начал» и «кончил»):
 * та же кривая насыщения, что у терминального Claude Code, с потолком - чтобы счётчик не
 * дошёл до 100 раньше самого компакта.
 */
export const COMPACT_TIME_CONSTANT_S = 90
export const COMPACT_CEILING_PERCENT = 95

export const RETRY_REASON_KEYS: Record<RetryReason, ParseKeys> = {
  rateLimited: 'claudeCode.notice.retry.reason.rateLimited',
  overloaded: 'claudeCode.notice.retry.reason.overloaded',
  auth: 'claudeCode.notice.retry.reason.auth',
  error: 'claudeCode.notice.retry.reason.error',
}

export const RETRY_OUTCOME_KEYS: Record<RetryOutcome, ParseKeys> = {
  recovered: 'claudeCode.notice.retry.recovered',
  failed: 'claudeCode.notice.retry.failed',
  stopped: 'claudeCode.notice.retry.stopped',
}

/** Причины, по которым быстрый режим не включился, - кодами CLI. */
export const FAST_REASON_KEYS: Record<string, ParseKeys> = {
  extra_usage_disabled: 'claudeCode.notice.fast.reasons.extraUsageDisabled',
  free: 'claudeCode.notice.fast.reasons.free',
  preference: 'claudeCode.notice.fast.reasons.preference',
  network_error: 'claudeCode.notice.fast.reasons.networkError',
  not_first_party: 'claudeCode.notice.fast.reasons.notFirstParty',
  disabled_by_env: 'claudeCode.notice.fast.reasons.disabledByEnv',
  model_not_allowed: 'claudeCode.notice.fast.reasons.modelNotAllowed',
}

/** Окна лимита по имени CLI: остальные называются как есть. */
export const LIMIT_WINDOW_KEYS: Record<string, ParseKeys> = {
  five_hour: 'claudeCode.notice.limit.windows.fiveHour',
  seven_day: 'claudeCode.notice.limit.windows.weekly',
  seven_day_opus: 'claudeCode.notice.limit.windows.weeklyOpus',
  seven_day_sonnet: 'claudeCode.notice.limit.windows.weeklySonnet',
}

/** Подробность отметки «прервано»: ход сняла панель ради переезда на другой аккаунт. */
export const ACCOUNT_STOP: StopReason = 'account'
