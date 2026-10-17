import type { ReactNode } from 'react'

export type ListBoxProps = {
  /** id из useListBox: на него ссылается поле поиска (aria-controls). */
  id: string
  /** Подпись для скринридера: что в списке. */
  label: string
  /** Варианты - ListBoxOption, группы с заголовком - MenuSection. */
  children: ReactNode
}
