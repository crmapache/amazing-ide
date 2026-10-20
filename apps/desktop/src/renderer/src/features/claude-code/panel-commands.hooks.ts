import type { Conversation } from '@shared/claude'

import { useClaudeActions } from './claude-actions.hooks'
import { useClaudeCodeStore } from './claude-code.store'
import { usePanelActions } from './panel-actions.hooks'
import type { PanelAction, PanelCommandId } from './slash.types'
import { SCREEN_VIEWS } from './SideMenu/SideMenu.constants'

/**
 * Карта команд панели: «/команда» выполняет IDE, а не CLI (как в ACC). Команда видна в
 * подсказке, только когда у неё есть действие; аргумент - то, что набрано после имени.
 */
export const usePanelCommands = (
  conversation: Conversation | null,
): Partial<Record<PanelCommandId, PanelAction>> => {
  const openMenu = useClaudeCodeStore((store) => store.openMenu)
  const actions = useClaudeActions()
  // /rename, /btw, /fast, /login, /logout, /design-login (panel-actions.hooks.ts).
  const own = usePanelActions(conversation)

  return {
    ...own,
    resume: () => openMenu('history'),
    ...(conversation ? { fork: () => void actions.fork(conversation.id, null) } : {}),
    // /status: строка SESSION в ленте - id разговора и как продолжить его в терминале.
    ...(conversation ? { status: () => void actions.showSessionInfo(conversation.id) } : {}),
    // Голый /config открывает экран настроек Claude Code; с «ключ=значение» его делает CLI.
    ...(SCREEN_VIEWS.claudeConfig ? { config: () => openMenu('claudeConfig') } : {}),
  }
}
