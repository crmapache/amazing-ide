import { SEARCH_TABS, SHORTCUT_TABS } from './search-everywhere.constants'
import type { KeyStroke, SearchTab } from './search-everywhere.types'

/**
 * Распознаёт двойной Shift, как в WebStorm: Shift нажат и отпущен сам по себе
 * дважды не дольше чем за interval. Любая другая клавиша между ними (Shift+A для
 * заглавной буквы) сбрасывает счёт. Состояние - в замыкании, по детектору на окно.
 */
export const createDoubleShiftDetector = (interval: number) => {
  let lastTapAt = Number.NEGATIVE_INFINITY
  let isCleanPress = false

  return (stroke: Pick<KeyStroke, 'type' | 'key' | 'repeat' | 'timeStamp'>): boolean => {
    if (stroke.key !== 'Shift') {
      isCleanPress = false
      lastTapAt = Number.NEGATIVE_INFINITY

      return false
    }

    if (stroke.type === 'keydown') {
      if (!stroke.repeat) isCleanPress = true

      return false
    }

    if (stroke.type !== 'keyup' || !isCleanPress) return false

    isCleanPress = false

    if (stroke.timeStamp - lastTapAt <= interval) {
      lastTapAt = Number.NEGATIVE_INFINITY

      return true
    }

    lastTapAt = stroke.timeStamp

    return false
  }
}

/** Латинская буква клавиши: из раскладки, а для нелатинской раскладки - по физической клавише. */
const latinLetter = ({ key, code }: Pick<KeyStroke, 'key' | 'code'>) => {
  if (/^[a-z]$/i.test(key)) return key.toLowerCase()

  return /^Key[A-Z]$/.test(code) ? code.slice(3).toLowerCase() : ''
}

/** Вкладка по сочетанию ⌘⇧ + буква или null, если это не сочетание поиска. */
export const tabForShortcut = (
  stroke: Pick<KeyStroke, 'key' | 'code' | 'metaKey' | 'shiftKey' | 'altKey' | 'ctrlKey'>,
): SearchTab | null => {
  if (!stroke.metaKey || !stroke.shiftKey || stroke.altKey || stroke.ctrlKey) return null

  return SHORTCUT_TABS[latinLetter(stroke)] ?? null
}

/** Соседняя вкладка по Tab и Shift+Tab, по кругу - как в поиске WebStorm. */
export const cycleTab = (tab: SearchTab, step: 1 | -1): SearchTab => {
  const index = SEARCH_TABS.indexOf(tab)

  return SEARCH_TABS[(index + step + SEARCH_TABS.length) % SEARCH_TABS.length] ?? tab
}
