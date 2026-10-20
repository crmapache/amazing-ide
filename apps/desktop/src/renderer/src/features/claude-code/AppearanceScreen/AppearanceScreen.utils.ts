import { TEXT_SIZE_MAX, TEXT_SIZE_MIN, TEXT_SIZE_FOLLOW } from '@shared/claude-prefs'

import { IDE_TEXT_SIZE } from '../panel-look.constants'

/** Размер, которым панель нарисована: свой или, пока своего нет, размер IDE. */
export const drawnSize = (chosen: number): number =>
  chosen === TEXT_SIZE_FOLLOW ? IDE_TEXT_SIZE : chosen

/**
 * Нажатие «меньше» или «больше»: пункт от того, что на экране, в пределах, где масштаб
 * ничего не обрезает молча. Нажатие из «как у IDE» само и есть выбор своего размера.
 */
export const stepTextSize = (chosen: number, direction: 1 | -1): number =>
  Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, drawnSize(chosen) + direction))
