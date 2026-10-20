import type {
  EventChannel,
  EventPayload,
  InvokeChannel,
  InvokeRequest,
  InvokeResponse,
} from '@shared/ipc/contract'

/**
 * Единственная дверь окна в главный процесс. Компоненты и сторы зовут каналы
 * отсюда, а не через window.ide: так видно, кто и что спрашивает у главного
 * процесса, и контракт проверяется компилятором на каждом вызове.
 */

/** Запрос в главный процесс. Каналы без данных зовутся без второго аргумента. */
export const invoke = <C extends InvokeChannel>(
  channel: C,
  ...request: InvokeRequest<C> extends void ? [] : [InvokeRequest<C>]
): Promise<InvokeResponse<C>> => window.ide.invoke(channel, request[0])

/** Подписка на событие главного процесса. Возвращает отписку. */
export const subscribe = <E extends EventChannel>(
  event: E,
  listener: (payload: EventPayload<E>) => void,
): (() => void) => window.ide.on(event, listener)

/** Путь на диске у файла, перетащенного из Finder; пусто - у файла нет пути. */
export const pathForFile = (file: File): string => window.ide.pathForFile(file)
