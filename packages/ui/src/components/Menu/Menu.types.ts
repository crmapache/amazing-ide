import type { ReactNode } from 'react'

export type MenuProps = {
  /** Подпись для скринридера: что это за меню. */
  label: string
  /**
   * При появлении поставить фокус: на элемент с data-autofocus (поле поиска) или на
   * первый доступный пункт. Меню во всплывающей панели монтируется при открытии.
   */
  autoFocus?: boolean
  children: ReactNode
}
