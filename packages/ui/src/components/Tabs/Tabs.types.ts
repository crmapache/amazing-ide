import type { LucideIcon } from 'lucide-react'

export type TabsItem<TabId extends string> = {
  id: TabId
  label: string
  icon?: LucideIcon | undefined
}

export type TabsProps<TabId extends string> = {
  /** Подпись ряда для скринридера: что переключают вкладки. */
  label: string
  items: readonly TabsItem<TabId>[]
  /** Выбранная вкладка. Её содержимое рисует тот, кто поставил Tabs. */
  value: TabId
  onChange: (id: TabId) => void
}
