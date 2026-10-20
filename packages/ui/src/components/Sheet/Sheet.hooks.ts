import type { UIEvent } from 'react'
import { useRef, useEffect, useLayoutEffect } from 'react'

/**
 * Esc внутри открытого листа: шаг назад или закрытие. Ловится на погружении и дальше не
 * идёт - ниже по странице та же клавиша значит другое (остановить ход агента).
 */
export const useSheetEscape = (open: boolean, onEscape: () => void) => {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return

      event.preventDefault()
      event.stopPropagation()
      onEscape()
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, onEscape])
}

/**
 * Где каждый экран листа был прокручен. Пишется на прокрутке, а не на уходе: к моменту
 * смены экрана браузер уже прижал отступ к новому, более короткому содержимому. Шаг
 * назад находит экран там, где его оставили; шаг вперёд открывает с начала. Закрытый
 * лист всё забывает.
 */
export const useScrollPlaces = (open: boolean, screenKey: string, restore: boolean) => {
  const bodyRef = useRef<HTMLDivElement>(null)
  const places = useRef(new Map<string, number>())
  const shown = useRef(screenKey)

  useLayoutEffect(() => {
    const target = bodyRef.current

    if (!target || shown.current === screenKey) return

    shown.current = screenKey

    const top = restore ? (places.current.get(screenKey) ?? 0) : 0

    places.current.set(screenKey, top)
    target.scrollTop = top
  }, [screenKey, restore])

  useEffect(() => {
    if (!open) places.current.clear()
  }, [open])

  const handleScroll = (event: UIEvent<HTMLDivElement>) =>
    places.current.set(shown.current, event.currentTarget.scrollTop)

  return { bodyRef, handleScroll }
}
