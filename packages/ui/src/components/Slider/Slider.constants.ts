/**
 * Клавиши, которыми ползунок действительно двигают: после них жест кончился. Иначе он
 * «кончался» бы от одного прихода на ползунок Tab-ом.
 */
export const SLIDER_MOVING_KEYS: ReadonlySet<string> = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])
