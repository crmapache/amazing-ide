import { useState } from 'react'

/**
 * Виды, которые уже открывали. Открытый однажды вид остаётся смонтированным и
 * только прячется: переключился на другой провайдер или свернул панель - разговор,
 * прокрутка и раскрытые папки на месте. Не открытый ни разу не грузится вовсе.
 */
export const useVisitedViews = <ViewId extends string>(activeViewId: ViewId, isOpen: boolean) => {
  const [visited, setVisited] = useState<ReadonlySet<ViewId>>(() =>
    isOpen ? new Set([activeViewId]) : new Set(),
  )

  if (isOpen && !visited.has(activeViewId)) {
    setVisited(new Set(visited).add(activeViewId))
  }

  return visited
}
