import { lazy } from 'react'
import { Files } from 'lucide-react'

import type { SideViewId } from '../../state/layout.types'
import type { ViewDescriptor } from './views.types'

/**
 * Виды левой панели (зона 5) в порядке иконок зоны 2. Новый вид: id в
 * SideViewId, компонент в своей фиче, запись здесь. Компонент грузится лениво -
 * пока вид не открыли, его код не тянется в окно.
 */
export const SIDE_VIEWS: readonly ViewDescriptor<SideViewId>[] = [
  {
    id: 'files',
    icon: Files,
    labelKey: 'sideViews.files',
    Component: lazy(() =>
      import('../../features/file-tree/FileTreeView/FileTreeView').then((module) => ({
        default: module.FileTreeView,
      })),
    ),
  },
]
