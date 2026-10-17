import type { PanelSide, SideViewId, ProviderViewId } from './layout.types'

/** Виды, которые есть сейчас. Сохранённый вид не из списка - удалённый, его не открыть. */
export const SIDE_VIEW_IDS: readonly SideViewId[] = ['files']
export const PROVIDER_VIEW_IDS: readonly ProviderViewId[] = ['claude-code']

export const PANEL_WIDTH_LIMITS: Record<PanelSide, { min: number; max: number }> = {
  side: { min: 180, max: 640 },
  provider: { min: 300, max: 960 },
}

export const DEFAULT_PANEL_WIDTH: Record<PanelSide, number> = {
  side: 280,
  provider: 440,
}

/** Ключ в localStorage. Версия в имени: сменилась форма - старое не подхватится. */
export const LAYOUT_STORAGE_KEY = 'amazing-ide.layout.v1'
