import { lazy } from 'react'
import { FileCode, Workflow, ChartColumn } from 'lucide-react'

import type { MainViewId } from '../../state/layout.types'
import type { ViewDescriptor } from './views.types'

/**
 * Виды середины окна (зона 6) в порядке иконок полосы слева от неё. Файл - то, что
 * открыли из левой панели; сценарии и статистика - возможности всей IDE, а не одного
 * провайдера LLM. Новый вид: id в MainViewId и MAIN_VIEW_IDS, компонент в своей
 * фиче, запись здесь.
 */
export const MAIN_VIEWS: readonly ViewDescriptor<MainViewId>[] = [
  {
    id: 'file',
    icon: FileCode,
    labelKey: 'mainViews.file',
    Component: lazy(() =>
      import('../../features/editor/EditorArea/EditorArea').then((module) => ({
        default: module.EditorArea,
      })),
    ),
  },
  {
    id: 'scenarios',
    icon: Workflow,
    labelKey: 'mainViews.scenarios',
    Component: lazy(() =>
      import('../../features/scenarios/ScenariosView/ScenariosView').then((module) => ({
        default: module.ScenariosView,
      })),
    ),
  },
  {
    id: 'statistics',
    icon: ChartColumn,
    labelKey: 'mainViews.statistics',
    Component: lazy(() =>
      import('../../features/statistics/StatisticsView/StatisticsView').then((module) => ({
        default: module.StatisticsView,
      })),
    ),
  },
]
