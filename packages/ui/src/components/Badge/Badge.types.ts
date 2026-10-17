import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

/** marker - точка тона и текст, для строк и таблиц; soft - тонированная плашка капсом. */
export type BadgeVariant = 'marker' | 'soft'

export type BadgeProps = {
  tone?: BadgeTone | undefined
  variant?: BadgeVariant | undefined
  /** Короткое слово или число: «Active», «3», «ahead 2». */
  children: ReactNode
}
