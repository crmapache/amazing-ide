import { MAIN_VIEW_IDS, SIDE_VIEW_IDS, PROVIDER_VIEW_IDS } from './layout.constants'
import type { Layout, PanelState, ViewAreaState } from './layout.types'

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const restoreArea = <ViewId extends string>(
  saved: unknown,
  fallback: ViewAreaState<ViewId>,
  viewIds: readonly ViewId[],
): ViewAreaState<ViewId> => {
  const { activeViewId, isOpen } = asRecord(saved)

  return {
    activeViewId: viewIds.find((viewId) => viewId === activeViewId) ?? fallback.activeViewId,
    isOpen: typeof isOpen === 'boolean' ? isOpen : fallback.isOpen,
  }
}

const restorePanel = <ViewId extends string>(
  saved: unknown,
  fallback: PanelState<ViewId>,
  viewIds: readonly ViewId[],
): PanelState<ViewId> => {
  const { width } = asRecord(saved)

  return {
    ...restoreArea(saved, fallback, viewIds),
    width: typeof width === 'number' ? width : fallback.width,
  }
}

/**
 * Раскладка из localStorage поверх раскладки по умолчанию. Сохранённое пишет старая
 * версия окна: вид могли удалить (так ушёл вид «Search»), поле - потерять или ещё не
 * завести (середину окна до её видов не сохраняли). Такое заменяется значением по
 * умолчанию, иначе панель открылась бы пустой.
 */
export const restoreLayout = (persisted: unknown, defaults: Layout): Layout => {
  const { side, main, provider } = asRecord(persisted)

  return {
    side: restorePanel(side, defaults.side, SIDE_VIEW_IDS),
    main: restoreArea(main, defaults.main, MAIN_VIEW_IDS),
    provider: restorePanel(provider, defaults.provider, PROVIDER_VIEW_IDS),
  }
}
