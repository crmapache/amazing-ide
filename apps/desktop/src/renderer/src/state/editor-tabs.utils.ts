import type { EditorTabs } from './editor-tabs.types'

export const NO_TABS: EditorTabs = { paths: [], recent: [] }

/** Активная вкладка - последняя выбранная. undefined - вкладок нет. */
export const activeTab = (tabs: EditorTabs | undefined): string | undefined => tabs?.recent.at(-1)

const without = (paths: readonly string[], drop: ReadonlySet<string>) =>
  paths.filter((path) => !drop.has(path))

/**
 * Выбрать файл: открытый - сделать активным на его месте в полосе, новый - открыть в
 * конце. Вкладок стало больше предела - закрываются самые давние из открытых, кроме
 * удерживаемых (held: несохранённое, которое молча не закрыть). Все удерживаются -
 * полоса временно длиннее предела: потерять правку хуже лишней вкладки.
 */
export const openTab = (
  tabs: EditorTabs,
  path: string,
  { limit, held }: { limit: number; held: ReadonlySet<string> },
): EditorTabs => {
  const recent = [...tabs.recent.filter((open) => open !== path), path]

  if (tabs.paths.includes(path)) return { paths: tabs.paths, recent }

  const paths = [...tabs.paths, path]
  const evicted = new Set<string>()

  for (const candidate of paths) {
    if (paths.length - evicted.size <= limit) break
    if (candidate !== path && !held.has(candidate)) evicted.add(candidate)
  }

  return { paths: without(paths, evicted), recent: without(recent, evicted) }
}

/** Закрыть вкладки. Закрылась активная - активной становится выбранная до неё. */
export const closeTabs = (tabs: EditorTabs, closing: readonly string[]): EditorTabs => {
  const drop = new Set(closing)

  return { paths: without(tabs.paths, drop), recent: without(tabs.recent, drop) }
}

/**
 * Вкладки из localStorage. Их пишет прошлый запуск или старая версия окна: строки, без
 * повторов, recent - только из открытых, и каждая открытая в нём есть (не выбиравшиеся -
 * в начале, как самые давние). Иначе закрытие активной вело бы в никуда.
 */
export const restoreTabs = (saved: unknown): EditorTabs => {
  const { paths, recent } = (typeof saved === 'object' && saved !== null ? saved : {}) as Record<
    string,
    unknown
  >
  const strings = (value: unknown) =>
    Array.isArray(value)
      ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
      : []
  const open = strings(paths)
  const chosen = strings(recent).filter((path) => open.includes(path))

  return { paths: open, recent: [...open.filter((path) => !chosen.includes(path)), ...chosen] }
}
