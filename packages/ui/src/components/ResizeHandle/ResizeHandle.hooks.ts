import { useRef } from 'react'
import type { PointerEvent, KeyboardEvent } from 'react'

import { KEYBOARD_STEP } from './ResizeHandle.constants'

/**
 * Перетаскивание ручки: указатель захватывается, и каждый сдвиг отдаётся наружу
 * разницей с прошлым положением. Клавиатура двигает тем же колбэком шагом KEYBOARD_STEP.
 */
export const useResizeDrag = (onResize: (deltaX: number) => void) => {
  const lastX = useRef<number | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    lastX.current = event.clientX
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (lastX.current === null) return

    const delta = event.clientX - lastX.current

    lastX.current = event.clientX
    if (delta !== 0) onResize(delta)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId)
    lastX.current = null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') onResize(-KEYBOARD_STEP)
    if (event.key === 'ArrowRight') onResize(KEYBOARD_STEP)
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown }
}
