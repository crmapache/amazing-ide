import type { ReactNode } from 'react'

export type ToastTone = 'neutral' | 'danger'

export type ToastProps = {
  title: string
  description?: string | undefined
  tone?: ToastTone | undefined
  /** Доля готового от 0 до 1: под текстом встаёт полоса прогресса. */
  progress?: number | undefined
  /** Кнопки действий (Button). Рисуются в ряд под текстом. */
  actions?: ReactNode | undefined
}
