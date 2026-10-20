import type { ComponentType } from 'react'

import type { MenuScreen, MenuScreenProps } from '../claude.types'
import { AccountsScreen } from '../AccountsScreen/AccountsScreen'
import { HistoryScreen } from '../HistoryScreen/HistoryScreen'
import { McpScreen } from '../McpScreen/McpScreen'
import { PluginsScreen } from '../PluginsScreen/PluginsScreen'
import { SettingsList } from '../SettingsList/SettingsList'
import { SETTINGS_VIEWS } from '../SettingsList/SettingsList.constants'

/**
 * Экран за каждым пунктом меню. Корень рисует MenuRoot; экрана, которого здесь нет,
 * в меню и не видно: строка на него не показывается.
 */
export const SCREEN_VIEWS: Partial<Record<MenuScreen, ComponentType<MenuScreenProps>>> = {
  history: HistoryScreen,
  mcp: McpScreen,
  plugins: PluginsScreen,
  accounts: AccountsScreen,
  settings: SettingsList,
  ...SETTINGS_VIEWS,
}
