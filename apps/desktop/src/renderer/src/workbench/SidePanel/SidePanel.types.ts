import type { ViewDescriptor } from '../views/views.types'

export type SidePanelProps<ViewId extends string> = {
  views: readonly ViewDescriptor<ViewId>[]
  activeViewId: ViewId
  isOpen: boolean
  width: number
  /** С какой стороны окна стоит панель. Ручка размера - у внутреннего края. */
  placement: 'start' | 'end'
  resizeLabel: string
  /** Изменение ширины панели в пикселях: плюс - шире. */
  onResize: (delta: number) => void
}
