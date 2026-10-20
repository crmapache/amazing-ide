import { WHEEL_LINE_PX } from './StreamSwitcher.constants'

/**
 * Ход колеса в пикселях. Колесо не всегда меряет пикселями: у части мышей событие
 * приходит строками или страницами, и «сырое» число 3 вместо 100 ряд почти не двигало.
 */
export const wheelStep = (event: WheelEvent, element: HTMLElement): number => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * WHEEL_LINE_PX
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * element.clientWidth

  return event.deltaY
}

/**
 * Команда двумя словами для чипа: `pnpm dev`, `sandbox.sh`. Описание модели - целое
 * предложение, на узкой панели оно вытолкнуло бы остальные чипы.
 */
export const commandLabel = (command: string): string => {
  const words = (command.split('\n')[0] ?? '').trim().split(/\s+/).filter(Boolean)
  const [first = '', second = ''] = words
  const name = first.split('/').pop() ?? first

  return second && !second.startsWith('-') ? `${name} ${second}` : name
}
