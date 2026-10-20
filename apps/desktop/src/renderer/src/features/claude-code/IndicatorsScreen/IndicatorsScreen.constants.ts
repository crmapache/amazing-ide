import type { IndicatorId } from '@shared/claude-prefs'

/** Два показания над полем, дальше - всё, что в строке под ним (порядок ACC). */
export const ABOVE_FIELD: readonly IndicatorId[] = ['contextBar', 'contextLabel']

export const BELOW_FIELD: readonly IndicatorId[] = [
  'ring5h',
  'ringWeek',
  'ringModel',
  'tokensToday',
]
