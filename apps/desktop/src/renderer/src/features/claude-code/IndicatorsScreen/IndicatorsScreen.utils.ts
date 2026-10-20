import type { IndicatorId } from '@shared/claude-prefs'
import type { AccountUsage } from '@shared/claude-usage'

/** Спрятать показание или вернуть: остальные выключатели не трогаются. */
export const toggleHidden = (hidden: readonly IndicatorId[], id: IndicatorId): IndicatorId[] =>
  hidden.includes(id) ? hidden.filter((item) => item !== id) : [...hidden, id]

/**
 * Модель, у которой своя неделя в тарифе (Fable), - по цифрам лимитов. Её имя -
 * имя сервера, не переводится; пока цифр нет - null, кольцо называется в общем.
 */
export const weeklyModel = (usage: AccountUsage | undefined): string | null =>
  usage?.windows.find((window) => window.group === 'weekly' && window.model)?.model ?? null
