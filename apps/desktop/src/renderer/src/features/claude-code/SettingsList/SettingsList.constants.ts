import type { ComponentType } from 'react'
import {
  Cpu,
  Palette,
  Volume2,
  FileText,
  SquarePlus,
  ClipboardList,
  SquareTerminal,
} from 'lucide-react'

import type { SettingsScreen, MenuScreenProps } from '../claude.types'
import { CalmColorsScreen } from '../CalmColorsScreen/CalmColorsScreen'
import { ClaudeConfigScreen } from '../ClaudeConfigScreen/ClaudeConfigScreen'
import { CustomModelsScreen } from '../CustomModelsScreen/CustomModelsScreen'
import { NewChatChoiceScreen } from '../NewChatChoiceScreen/NewChatChoiceScreen'
import { NewChatScreen } from '../NewChatScreen/NewChatScreen'
import { PasteCollapseScreen } from '../PasteCollapseScreen/PasteCollapseScreen'
import { ShareEditorScreen } from '../ShareEditorScreen/ShareEditorScreen'
import { SoundsScreen } from '../SoundsScreen/SoundsScreen'
import type { SettingsRow } from './SettingsList.types'

/**
 * Порядок как в ACC: сначала то, за чем открывают список (звуки, цвета), потом новые
 * вкладки, потом поле ввода, потом настройки самого Claude Code и свои модели.
 */
export const SETTINGS_ROWS: readonly SettingsRow[] = [
  { screen: 'sounds', icon: Volume2 },
  { screen: 'calmColors', icon: Palette },
  { screen: 'newChat', icon: SquarePlus },
  { screen: 'shareEditor', icon: FileText },
  { screen: 'pasteCollapse', icon: ClipboardList },
  { screen: 'claudeConfig', icon: SquareTerminal },
  { screen: 'customModels', icon: Cpu },
]

/**
 * Экраны настроек. Строка в списке видна, только когда у её экрана есть вид: недоделанный
 * экран не обещает настройку, которой нет.
 */
export const SETTINGS_VIEWS: Partial<Record<SettingsScreen, ComponentType<MenuScreenProps>>> = {
  sounds: SoundsScreen,
  calmColors: CalmColorsScreen,
  newChat: NewChatScreen,
  newChatModel: NewChatChoiceScreen,
  newChatEffort: NewChatChoiceScreen,
  newChatMode: NewChatChoiceScreen,
  shareEditor: ShareEditorScreen,
  pasteCollapse: PasteCollapseScreen,
  claudeConfig: ClaudeConfigScreen,
  customModels: CustomModelsScreen,
}
