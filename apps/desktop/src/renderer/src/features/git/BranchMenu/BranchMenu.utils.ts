/** Поиск в меню ветки: без регистра, по любой части имени. */
export const matchesQuery = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query.trim().toLowerCase())

export const filterByQuery = <T>(items: readonly T[], query: string, text: (item: T) => string) =>
  items.filter((item) => matchesQuery(text(item), query))

/** Действие, которое уже умеем делать (commit - ещё нет). */
export const isAvailableAction = (
  id: string,
): id is 'update' | 'push' | 'newBranch' | 'checkoutRevision' => id !== 'commit'
