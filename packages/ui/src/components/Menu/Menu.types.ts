import type { ReactNode } from 'react'

export type MenuProps = {
  /** Подпись для скринридера: что это за меню. */
  label: string
  /**
   * При появлении поставить фокус: на элемент с data-autofocus (поле поиска) или на
   * первый доступный пункт. Меню во всплывающей панели монтируется при открытии.
   */
  autoFocus?: boolean
  /**
   * Над пунктами, стоит на месте при прокрутке: поле поиска. Меню во всплывающей
   * панели - шапка ложится вровень с её краями.
   */
  header?: ReactNode | undefined
  children: ReactNode
}
