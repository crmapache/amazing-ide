import { useRef, useEffect } from 'react'

import type { EventChannel, EventPayload } from '@shared/ipc/contract'

import { subscribe } from './ipc'

/**
 * Подписка компонента на событие главного процесса на всё время его жизни.
 * Слушатель можно передавать стрелкой прямо в рендере: подписка от этого не
 * пересоздаётся, а зовётся всегда последняя версия.
 */
export const useIpcEvent = <E extends EventChannel>(
  event: E,
  listener: (payload: EventPayload<E>) => void,
) => {
  const latestListener = useRef(listener)

  useEffect(() => {
    latestListener.current = listener
  })

  useEffect(() => subscribe(event, (payload) => latestListener.current(payload)), [event])
}
