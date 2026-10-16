import type { Ref, ReactNode, ToggleEventHandler } from 'react'

export type PopoverWidth = 'md' | 'lg'

export type PopoverProps = {
  id: string
  ref: Ref<HTMLDivElement>
  onToggle: ToggleEventHandler<HTMLDivElement>
  width?: PopoverWidth
  children: ReactNode
}
