import type { KeyboardEvent } from 'react'
import { useRef, useEffect } from 'react'

import { SLIDER_MOVING_KEYS } from './Slider.constants'

/**
 * Конец жеста на ползунке: отпустили мышь или подвинули клавишей. Отпускание ловится на
 * окне, а не на ползунке: дотянув до края, руку ведут дальше, и отпускание приходится
 * мимо него. Зовётся всегда последний onChangeEnd - с последним значением, а не с тем,
 * что было в начале жеста.
 */
export const useChangeEnd = (onChangeEnd: (() => void) | undefined) => {
  const latest = useRef(onChangeEnd)
  const release = useRef<(() => void) | null>(null)

  useEffect(() => {
    latest.current = onChangeEnd
  })

  const stopWatching = () => {
    if (release.current) window.removeEventListener('pointerup', release.current)

    release.current = null
  }

  // Ползунок могут убрать посреди жеста: слушатель окна не должен его пережить.
  useEffect(() => stopWatching, [])

  const handlePointerDown = () => {
    if (!latest.current) return

    stopWatching()
    release.current = () => {
      stopWatching()
      latest.current?.()
    }
    window.addEventListener('pointerup', release.current)
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (SLIDER_MOVING_KEYS.has(event.key)) latest.current?.()
  }

  return { onPointerDown: handlePointerDown, onKeyUp: handleKeyUp }
}
