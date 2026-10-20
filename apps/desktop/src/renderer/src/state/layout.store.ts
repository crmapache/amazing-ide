import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LAYOUT_STORAGE_KEY, PANEL_WIDTH_LIMITS, DEFAULT_PANEL_WIDTH } from './layout.constants'
import type {
  Layout,
  PanelSide,
  MainViewId,
  SideViewId,
  ViewAreaState,
  ProviderViewId,
} from './layout.types'
import { restoreLayout } from './layout.utils'

type LayoutStore = Layout & {
  /**
   * Клик по иконке вида. Другой вид - показать его (и развернуть область). Тот же,
   * что уже показан, - свернуть или развернуть область. Так у обеих панелей и середины.
   */
  selectSideView: (viewId: SideViewId) => void
  selectMainView: (viewId: MainViewId) => void
  selectProviderView: (viewId: ProviderViewId) => void
  /** Сдвинуть ширину панели на delta пикселей с учётом пределов. */
  resizePanel: (side: PanelSide, delta: number) => void
}

const clampWidth = (side: PanelSide, width: number) =>
  Math.min(PANEL_WIDTH_LIMITS[side].max, Math.max(PANEL_WIDTH_LIMITS[side].min, width))

const select = <Area extends ViewAreaState<string>>(
  area: Area,
  viewId: Area['activeViewId'],
): Area =>
  area.activeViewId === viewId
    ? { ...area, isOpen: !area.isOpen }
    : { ...area, activeViewId: viewId, isOpen: true }

/**
 * Раскладка окна: какой вид в каждой боковой панели и в середине, развёрнута ли
 * область, и какой ширины панели. Чисто интерфейсное состояние - живёт в окне и
 * переживает перезапуск.
 */
export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      side: { activeViewId: 'files', isOpen: true, width: DEFAULT_PANEL_WIDTH.side },
      main: { activeViewId: 'file', isOpen: true },
      provider: { activeViewId: 'claude-code', isOpen: true, width: DEFAULT_PANEL_WIDTH.provider },

      selectSideView: (viewId) => set((state) => ({ side: select(state.side, viewId) })),
      selectMainView: (viewId) => set((state) => ({ main: select(state.main, viewId) })),
      selectProviderView: (viewId) =>
        set((state) => ({ provider: select(state.provider, viewId) })),
      resizePanel: (side, delta) =>
        set((state) => ({
          [side]: { ...state[side], width: clampWidth(side, state[side].width + delta) },
        })),
    }),
    {
      name: LAYOUT_STORAGE_KEY,
      partialize: ({ side, main, provider }) => ({ side, main, provider }),
      merge: (persisted, current) => ({ ...current, ...restoreLayout(persisted, current) }),
    },
  ),
)
