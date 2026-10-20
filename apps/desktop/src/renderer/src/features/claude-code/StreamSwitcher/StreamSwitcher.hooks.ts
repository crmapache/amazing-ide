import { useCallback } from 'react'

import { wheelStep } from './StreamSwitcher.utils'

/**
 * Колесо мыши листает ряд чипов вбок: оно крутит только вертикально, и без перевода
 * чипы за краем были бы недоступны без трекпада и Shift. Горизонтальный жест трекпада
 * браузер ведёт сам. Слушатель не пассивный - иначе лента под рядом листалась бы тоже.
 */
export const useWheelToSide = () =>
  useCallback((element: HTMLDivElement | null) => {
    if (!element) return

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

      element.scrollLeft += wheelStep(event, element)
      event.preventDefault()
    }

    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => element.removeEventListener('wheel', handleWheel)
  }, [])
