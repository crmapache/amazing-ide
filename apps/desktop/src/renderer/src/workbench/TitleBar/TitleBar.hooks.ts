import { useRef, useLayoutEffect } from 'react'

import { invoke } from '../../lib/ipc'

/**
 * Высота шапки - главному процессу: шапка растёт с размером текста, а «светофор» macOS
 * рисует система поверх неё, и сдвинуть его к середине шапки может только главный процесс.
 * Шлётся только новая высота, до целого пикселя.
 */
export const useTitleBarHeightReport = () => {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const bar = ref.current

    if (!bar) return

    let reported = 0
    const observer = new ResizeObserver(() => {
      const height = Math.round(bar.getBoundingClientRect().height)

      if (height === reported) return

      reported = height
      void invoke('window:setTitleBarHeight', { height })
    })

    observer.observe(bar)

    return () => observer.disconnect()
  }, [])

  return ref
}
