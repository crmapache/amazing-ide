import type { ParseKeys } from 'i18next'

import type { TurnEnd } from './TurnSummary.types'

/** Подпись итога: со временем работы и без него (время неизвестно). */
export const RESULT_KEYS: Record<TurnEnd, { timed: ParseKeys; bare: ParseKeys }> = {
  worked: { timed: 'claudeCode.feed.result.worked', bare: 'claudeCode.feed.result.workedBare' },
  stopped: { timed: 'claudeCode.feed.result.stopped', bare: 'claudeCode.feed.result.stoppedBare' },
  movedAccount: {
    timed: 'claudeCode.feed.result.movedAccount',
    bare: 'claudeCode.feed.result.movedAccountBare',
  },
}
