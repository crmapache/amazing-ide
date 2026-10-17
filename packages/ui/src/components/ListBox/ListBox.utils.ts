/**
 * Какой вариант выделить по клавише. Список ходит по кругу: вниз с последнего - на
 * первый, вверх с первого - на последний, как в поиске WebStorm. Не стрелка - null,
 * клавишу обрабатывает поле (Home и End двигают курсор в тексте, а не выделение).
 */
export const nextActiveIndex = (key: string, current: number, count: number): number | null => {
  if (count === 0) return null
  if (key === 'ArrowDown') return current < 0 || current >= count - 1 ? 0 : current + 1
  if (key === 'ArrowUp') return current <= 0 ? count - 1 : current - 1

  return null
}
