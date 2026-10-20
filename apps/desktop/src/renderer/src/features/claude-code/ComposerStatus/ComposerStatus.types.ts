import type { ReactNode } from 'react'

import type { Conversation } from '@shared/claude'
import type { IndicatorId } from '@shared/claude-prefs'

import type { RingMeterTone } from '@amazing-ide/ui/RingMeter.types'

/**
 * Тон режима: обычный - тихий, план - справочный, правки без вопроса - внимание, без
 * вопросов - красный.
 */
export type ModeTone = 'quiet' | 'info' | 'accent' | 'danger' | 'warning'

export type ComposerStatusProps = {
  conversation: Conversation
}

/** Селекторы строки получают тот же разговор, что и сама строка. */
export type PickerProps = ComposerStatusProps

export type OptionPickerProps = {
  /** Что выбирается - подпись капсом перед значением: MODEL, EFFORT, MODE. */
  caption: string
  /** Текущее значение на кнопке. */
  label: string
  /** Тон значения, когда оно говорит о свободе модели (режим). */
  tone?: ModeTone | undefined
  /** Знак после подписи: ↯ быстрого режима на MODEL. */
  mark?: ReactNode | undefined
  /** Подсказка над кнопкой: «Model: Opus 5.5». */
  hint: string
  menuLabel: string
  /** Пункты меню. */
  children: ReactNode
}

/** Кольцо лимита в строке: доля, бледная дуга темпа, тон, подсказка и какой выключатель его прячет. */
export type UsageRing = {
  key: string
  indicator: IndicatorId
  value: number
  pace: number | null
  tone: RingMeterTone
  burning: boolean
  hint: string
}

export type UsageRingsProps = {
  hidden: readonly IndicatorId[]
}
