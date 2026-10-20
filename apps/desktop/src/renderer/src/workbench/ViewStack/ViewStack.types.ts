import type { ViewDescriptor } from '../views/views.types'

export type ViewStackProps<ViewId extends string> = {
  views: readonly ViewDescriptor<ViewId>[]
  activeViewId: ViewId
  /** Развёрнута ли область: у свёрнутой виды спрятаны, а не открытый ни разу и не грузится. */
  isOpen: boolean
}
