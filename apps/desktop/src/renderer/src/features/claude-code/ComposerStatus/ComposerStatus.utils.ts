import type { TFunction } from 'i18next'

import type { AccountUsage } from '@shared/claude-usage'

import { WEEK_MS, FIVE_HOUR_MS, USAGE_FULL_PERCENT } from '../usage.constants'
import { paceTone, weekBudget, windowLabel, windowPercent, formatRemaining } from '../usage.utils'
import type { UsageRing } from './ComposerStatus.types'

/**
 * Кольца лимитов по порядку ACC: пять часов, неделя, неделя модели (Fable). У недель -
 * бледная дуга ровного темпа. Окно, которое упёрлось, пока идёт доплата, - горящее
 * кольцо без цифры: его процент застрял на ста и ничего не говорит.
 */
export const usageRings = (usage: AccountUsage, now: number, t: TFunction): UsageRing[] =>
  usage.windows.flatMap((window) => {
    const isSession = window.group === 'session' && window.model === ''
    const isWeek = window.group === 'weekly'

    if (!isSession && !isWeek) return []

    const value = windowPercent(window, now)
    const pace = isWeek ? weekBudget(window.resetsAt, now) : null
    const resetsIn = window.resetsAt !== null ? window.resetsAt - now : 0
    const lines = [
      t('claudeCode.usage.ringHint', { label: windowLabel(window, t), value: Math.round(value) }),
      resetsIn > 0 ? t('claudeCode.usage.resetsIn', { time: formatRemaining(resetsIn) }) : '',
      pace !== null ? t('claudeCode.usage.paceBudget', { value: pace }) : '',
    ]

    return [
      {
        key: `${window.group}:${window.model}`,
        indicator: isSession ? 'ring5h' : window.model ? 'ringModel' : 'ringWeek',
        value,
        pace,
        tone: paceTone(value, window.resetsAt, isSession ? FIVE_HOUR_MS : WEEK_MS, now),
        burning: usage.extra !== null && value >= USAGE_FULL_PERCENT,
        hint: lines.filter(Boolean).join(' · '),
      },
    ]
  })
