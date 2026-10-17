import { useSyncExternalStore } from 'react'

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange)

  return () => document.removeEventListener('visibilitychange', onChange)
}

const isPageVisible = () => document.visibilityState === 'visible'

/**
 * Видно ли окно IDE. Свёрнутое, спрятанное или целиком закрытое другими окнами
 * считается скрытым. Не путать с фокусом: окно рядом с терминалом видно, хотя
 * фокус у терминала.
 */
export const usePageVisible = () => useSyncExternalStore(subscribeToVisibility, isPageVisible)
