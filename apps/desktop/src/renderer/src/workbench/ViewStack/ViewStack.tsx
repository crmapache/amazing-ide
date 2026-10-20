import { Suspense } from 'react'

import { useVisitedViews } from './ViewStack.hooks'
import styles from './ViewStack.module.scss'
import type { ViewStackProps } from './ViewStack.types'

/**
 * Виды одной области окна стопкой: активный показан, открытые раньше смонтированы и
 * спрятаны, не открытые ни разу не грузятся. У свёрнутой области спрятаны все. Общий
 * для боковых панелей и середины окна - переключился на другой вид или свернул и
 * вернулся, а прокрутка и раскрытое на месте.
 */
export const ViewStack = <ViewId extends string>({
  views,
  activeViewId,
  isOpen,
}: ViewStackProps<ViewId>) => {
  const visited = useVisitedViews(activeViewId, isOpen)

  return views
    .filter((view) => visited.has(view.id))
    .map(({ id, Component }) => (
      <div key={id} className={styles.view} hidden={!isOpen || id !== activeViewId}>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </div>
    ))
}
