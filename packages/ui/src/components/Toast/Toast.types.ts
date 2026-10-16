import type { ReactNode } from 'react'

export type ToastTone = 'neutral' | 'danger'

export type ToastProps = {
  title: string
  description?: string | undefined
  tone?: ToastTone | undefined
  /** Кнопки действий (Button). Рисуются в ряд под текстом. */
  actions?: ReactNode | undefined
}
