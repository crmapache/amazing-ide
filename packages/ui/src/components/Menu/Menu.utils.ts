/**
 * Куда перейти по клавише из текущей позиции. -1 - фокус не на пункте (например, в
 * поле поиска): вниз - на первый пункт. Список не зацикливается вверх из первого
 * пункта, чтобы можно было вернуться в поле поиска.
 */
export const nextIndex = (key: string, current: number, count: number): number | null => {
  if (count === 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowDown') return current < 0 ? 0 : Math.min(current + 1, count - 1)
  if (key === 'ArrowUp') return current <= 0 ? null : current - 1

  return null
}
