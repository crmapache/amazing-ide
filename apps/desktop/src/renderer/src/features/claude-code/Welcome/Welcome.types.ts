import type { ParseKeys } from 'i18next'
import type { LucideIcon } from 'lucide-react'

export type WelcomeProps = {
  /** Ключ черновика поля ввода: подсказка подставляется туда. */
  draftKey: string
}

export type WelcomeSuggestion = { icon: LucideIcon; textKey: ParseKeys }
