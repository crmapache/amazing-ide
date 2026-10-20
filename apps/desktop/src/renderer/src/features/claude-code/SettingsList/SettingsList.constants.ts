import type { ComponentType } from 'react'
import {
  Cpu,
  Layers,
  Palette,
  SunMoon,
  Volume2,
  FileText,
  Keyboard,
  RotateCcw,
  SpellCheck,
  SquarePlus,
  CircleGauge,
  PanelBottom,
  ClipboardList,
  CornerDownLeft,
  SquareTerminal,
} from 'lucide-react'

import type { SettingsScreen, MenuScreenProps } from '../claude.types'
import { AppearanceScreen } from '../AppearanceScreen/AppearanceScreen'
import { CalmColorsScreen } from '../CalmColorsScreen/CalmColorsScreen'
import { ClaudeConfigScreen } from '../ClaudeConfigScreen/ClaudeConfigScreen'
import { ComposerLayoutScreen } from '../ComposerLayoutScreen/ComposerLayoutScreen'
import { CustomModelsScreen } from '../CustomModelsScreen/CustomModelsScreen'
import { IndicatorsScreen } from '../IndicatorsScreen/IndicatorsScreen'
import { KeysScreen } from '../KeysScreen/KeysScreen'
import { NewChatChoiceScreen } from '../NewChatChoiceScreen/NewChatChoiceScreen'
import { NewChatScreen } from '../NewChatScreen/NewChatScreen'
import { PasteCollapseScreen } from '../PasteCollapseScreen/PasteCollapseScreen'
import { RestoreTabsScreen } from '../RestoreTabsScreen/RestoreTabsScreen'
import { SendKeyScreen } from '../SendKeyScreen/SendKeyScreen'
import { SettingSourcesScreen } from '../SettingSourcesScreen/SettingSourcesScreen'
import { ShareEditorScreen } from '../ShareEditorScreen/ShareEditorScreen'
import { SoundsScreen } from '../SoundsScreen/SoundsScreen'
import { SpellcheckScreen } from '../SpellcheckScreen/SpellcheckScreen'
import type { SettingsRow } from './SettingsList.types'

/**
 * Порядок как в ACC: сначала то, за чем открывают список (вид, звуки, цвета), потом
 * вкладки, потом поле ввода, потом слои Claude Code и свои модели.
 */
export const SETTINGS_ROWS: readonly SettingsRow[] = [
  { screen: 'appearance', icon: SunMoon },
  { screen: 'sounds', icon: Volume2 },
  { screen: 'calmColors', icon: Palette },
  { screen: 'indicators', icon: CircleGauge },
  { screen: 'newChat', icon: SquarePlus },
  { screen: 'restoreTabs', icon: RotateCcw },
  { screen: 'shareEditor', icon: FileText },
  { screen: 'composerLayout', icon: PanelBottom },
  { screen: 'pasteCollapse', icon: ClipboardList },
  { screen: 'spellcheck', icon: SpellCheck },
  { screen: 'sendKey', icon: CornerDownLeft },
  { screen: 'keys', icon: Keyboard },
  { screen: 'settingSources', icon: Layers },
  { screen: 'claudeConfig', icon: SquareTerminal },
  { screen: 'customModels', icon: Cpu },
]

/**
 * Экраны настроек. Строка в списке видна, только когда у её экрана есть вид: недоделанный
 * экран не обещает настройку, которой нет.
 */
export const SETTINGS_VIEWS: Partial<Record<SettingsScreen, ComponentType<MenuScreenProps>>> = {
  appearance: AppearanceScreen,
  sounds: SoundsScreen,
  calmColors: CalmColorsScreen,
  indicators: IndicatorsScreen,
  newChat: NewChatScreen,
  newChatModel: NewChatChoiceScreen,
  newChatEffort: NewChatChoiceScreen,
  newChatMode: NewChatChoiceScreen,
  restoreTabs: RestoreTabsScreen,
  shareEditor: ShareEditorScreen,
  composerLayout: ComposerLayoutScreen,
  pasteCollapse: PasteCollapseScreen,
  spellcheck: SpellcheckScreen,
  sendKey: SendKeyScreen,
  keys: KeysScreen,
  settingSources: SettingSourcesScreen,
  claudeConfig: ClaudeConfigScreen,
  customModels: CustomModelsScreen,
}
