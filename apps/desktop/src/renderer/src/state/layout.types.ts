/** Виды зоны 5 (левая панель), переключаются иконками зоны 2. */
export type SideViewId = 'files'

/** GUI провайдеров LLM в зоне 7 (правая панель), переключаются иконками зоны 3. */
export type ProviderViewId = 'claude-code'

export type PanelState<ViewId extends string> = {
  activeViewId: ViewId
  isOpen: boolean
  /** Ширина в пикселях, в пределах PANEL_WIDTH_LIMITS. */
  width: number
}

export type PanelSide = 'side' | 'provider'

/** Обе боковые панели разом: так раскладка сохраняется и восстанавливается. */
export type LayoutPanels = {
  side: PanelState<SideViewId>
  provider: PanelState<ProviderViewId>
}
