import type { Ref } from 'react'

import type { ViewDescriptor } from '../views/views.types'

export type SidePanelProps<ViewId extends string> = {
  views: readonly ViewDescriptor<ViewId>[]
  activeViewId: ViewId
  isOpen: boolean
  /** Ширина на экране - сохранённая или ужатая под место в окне. */
  width: number
  /** Уже панель не ужимается, даже когда окну не хватает места. */
  minWidth: number
  /** С какой стороны окна стоит панель. Ручка размера - у внутреннего края. */
  placement: 'start' | 'end'
  resizeLabel: string
  /** Изменение ширины панели в пикселях: плюс - шире. */
  onResize: (delta: number) => void
  /** Лист панели - по нему Workbench мерит место в окне. */
  ref?: Ref<HTMLElement>
}
