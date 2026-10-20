import type { SearchTab } from './search-everywhere.types'

/** Порядок вкладок - как в WebStorm (без Classes и Symbols, их пока нечем искать). */
export const SEARCH_TABS: readonly SearchTab[] = ['all', 'files', 'actions', 'text']

/**
 * Сочетания вкладок, как в WebStorm: ⌘⇧O - файлы, ⌘⇧A - действия, ⌘⇧F - текст. Буква
 * берётся из раскладки (на AZERTY A стоит на месте Q), а если раскладка не латинская
 * (русская) - по физической клавише.
 */
export const SHORTCUT_TABS: Readonly<Record<string, SearchTab>> = {
  o: 'files',
  a: 'actions',
  f: 'text',
}

/** Два Shift подряд не дольше этого - открыть поиск. Как в WebStorm. */
export const DOUBLE_SHIFT_INTERVAL_MS = 400

/** Сколько вариантов каждой группы показывает вкладка «All» - остальное во вкладке группы. */
export const ALL_TAB_GROUP_LIMIT = 6

/** Предел списка файлов: дальше человек уточнит запрос, а не будет листать. */
export const FILES_LIMIT = 60

/** Поиск текста с одной буквы нашёл бы весь проект: начинаем с двух. */
export const TEXT_MIN_QUERY = 2

/** Пауза после последней нажатой клавиши перед поиском текста: не гонять git на каждую букву. */
export const TEXT_DEBOUNCE_MS = 180

/** Действие совпало только по ключевому слову, не по подписи: ниже любого совпадения подписи. */
export const KEYWORD_ONLY_SCORE = -20
