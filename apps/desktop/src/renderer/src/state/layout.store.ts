import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { LAYOUT_STORAGE_KEY, PANEL_WIDTH_LIMITS, DEFAULT_PANEL_WIDTH } from './layout.constants'
import type { PanelSide, PanelState, SideViewId, ProviderViewId } from './layout.types'

type LayoutStore = {
  side: PanelState<SideViewId>
  provider: PanelState<ProviderViewId>
  /**
   * Клик по иконке вида. Другой вид - показать его (и открыть панель). Тот же,
   * что уже показан, - свернуть или развернуть панель.
   */
  selectSideView: (viewId: SideViewId) => void
  selectProviderView: (viewId: ProviderViewId) => void
  /** Показать вид левой панели, открыв её. В отличие от select, никогда не сворачивает. */
  showSideView: (viewId: SideViewId) => void
  /** Сдвинуть ширину панели на delta пикселей с учётом пределов. */
  resizePanel: (side: PanelSide, delta: number) => void
}

const clampWidth = (side: PanelSide, width: number) =>
  Math.min(PANEL_WIDTH_LIMITS[side].max, Math.max(PANEL_WIDTH_LIMITS[side].min, width))

const select = <ViewId extends string>(panel: PanelState<ViewId>, viewId: ViewId) =>
  panel.activeViewId === viewId
    ? { ...panel, isOpen: !panel.isOpen }
    : { ...panel, activeViewId: viewId, isOpen: true }

/**
 * Раскладка окна: какой вид в каждой боковой панели, открыта ли она и какой
 * ширины. Чисто интерфейсное состояние - живёт в окне и переживает перезапуск.
 */
export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      side: { activeViewId: 'files', isOpen: true, width: DEFAULT_PANEL_WIDTH.side },
      provider: { activeViewId: 'claude-code', isOpen: true, width: DEFAULT_PANEL_WIDTH.provider },

      selectSideView: (viewId) => set((state) => ({ side: select(state.side, viewId) })),
      selectProviderView: (viewId) =>
        set((state) => ({ provider: select(state.provider, viewId) })),
      showSideView: (viewId) =>
        set((state) => ({ side: { ...state.side, activeViewId: viewId, isOpen: true } })),
      resizePanel: (side, delta) =>
        set((state) => ({
          [side]: { ...state[side], width: clampWidth(side, state[side].width + delta) },
        })),
    }),
    {
      name: LAYOUT_STORAGE_KEY,
      partialize: ({ side, provider }) => ({ side, provider }),
    },
  ),
)
