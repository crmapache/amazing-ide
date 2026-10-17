import type { ReactNode, ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonSize = 'sm' | 'md'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Иконка слева от текста. */
  icon?: LucideIcon | undefined
  children: ReactNode
}
