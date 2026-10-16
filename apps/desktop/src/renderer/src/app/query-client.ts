import { QueryClient, focusManager } from '@tanstack/react-query'

/**
 * Кэш данных главного процесса. Сети здесь нет: IPC локальный и быстрый, а
 * свежесть держат события из главного процесса, поэтому фоновых перезапросов нет.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

/**
 * «Окно в фокусе» для React Query - фокус окна Electron, а не видимость вкладки:
 * переключился из терминала обратно в IDE - запросы, которые просили обновляться при
 * возврате (ветка git), перечитываются. По умолчанию они этого не делают.
 */
focusManager.setEventListener((handleFocus) => {
  const handleWindowFocus = () => handleFocus(true)
  const handleWindowBlur = () => handleFocus(false)

  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)

  return () => {
    window.removeEventListener('focus', handleWindowFocus)
    window.removeEventListener('blur', handleWindowBlur)
  }
})
