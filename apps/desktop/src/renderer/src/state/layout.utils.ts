import { SIDE_VIEW_IDS, PROVIDER_VIEW_IDS } from './layout.constants'
import type { PanelState, LayoutPanels } from './layout.types'

const restorePanel = <ViewId extends string>(
  saved: unknown,
  fallback: PanelState<ViewId>,
  viewIds: readonly ViewId[],
): PanelState<ViewId> => {
  if (typeof saved !== 'object' || saved === null) return fallback

  const { activeViewId, isOpen, width } = saved as Record<string, unknown>
  const isKnownView = viewIds.some((viewId) => viewId === activeViewId)

  return {
    activeViewId: isKnownView ? (activeViewId as ViewId) : fallback.activeViewId,
    isOpen: typeof isOpen === 'boolean' ? isOpen : fallback.isOpen,
    width: typeof width === 'number' ? width : fallback.width,
  }
}

/**
 * Раскладка из localStorage поверх раскладки по умолчанию. Сохранённое пишет старая
 * версия окна: вид могли удалить (так ушёл вид «Search»), поле - потерять. Такое
 * заменяется значением по умолчанию, иначе панель открылась бы пустой.
 */
export const restoreLayout = (persisted: unknown, defaults: LayoutPanels): LayoutPanels => {
  const saved = typeof persisted === 'object' && persisted !== null ? persisted : {}
  const { side, provider } = saved as Record<string, unknown>

  return {
    side: restorePanel(side, defaults.side, SIDE_VIEW_IDS),
    provider: restorePanel(provider, defaults.provider, PROVIDER_VIEW_IDS),
  }
}
