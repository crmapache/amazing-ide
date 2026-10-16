import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type EmptyStateProps = {
  title: string
  description?: string | undefined
  icon?: LucideIcon | undefined
  /** Действие, которое выводит из пустоты: обычно одна Button. */
  action?: ReactNode | undefined
}
