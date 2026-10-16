import type { ReactNode } from 'react'

export type MenuSectionProps = {
  title: string
  /** Заголовок сворачивает и разворачивает группу (как «Local» у веток). */
  collapsible?: boolean | undefined
  /** Свёрнута при первом показе: длинный список удалённых веток. */
  defaultCollapsed?: boolean | undefined
  /** Развернуть, что бы ни выбрал человек: идёт поиск, найденное должно быть видно. */
  forceExpanded?: boolean | undefined
  children: ReactNode
}
