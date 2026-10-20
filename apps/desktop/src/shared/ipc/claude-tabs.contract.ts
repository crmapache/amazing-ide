import type { ClaudeState, PanelKeyCommand } from '../claude'

/**
 * Часть контракта (contract.ts) про полосу вкладок разговоров: закрытие и возврат,
 * порядок и группы форков, имена, клавиши панели. Отдельным файлом по области: общий
 * контракт перерос лимит строк. В InvokeContract, EventContract и списки каналов она
 * входит целиком, правила те же (.claude/rules/ipc-contract.md).
 */
export type ClaudeTabsInvokeContract = {
  /**
   * Закрыть вкладку; закрытую человеком можно вернуть (claude:reopenClosed). hasDraft -
   * в поле что-то написано: пустую вкладку с черновиком тоже стоит помнить.
   */
  'claude:closeConversation': {
    request: { conversationId: string; hasDraft?: boolean }
    response: ClaudeState
  }
  /**
   * Вернуть закрытую вкладку на прежнее место, в прежнюю группу и под прежним id.
   * closedId null - последнюю закрытую.
   */
  'claude:reopenClosed': {
    request: { projectId: string; closedId: string | null }
    response: ClaudeState
  }
  /** Имя от человека: перебивает любое, уходит в транскрипт (история, `claude --resume`). */
  'claude:rename': { request: { conversationId: string; title: string }; response: ClaudeState }
  /** Переставить форк внутри своей группы: перед вкладкой beforeId, null - в конец группы. */
  'claude:moveTab': {
    request: { conversationId: string; beforeId: string | null }
    response: ClaudeState
  }
  /** Переставить группу форков целиком перед группой beforeId, null - в конец полосы. */
  'claude:moveGroup': {
    request: { groupId: string; beforeId: string | null }
    response: ClaudeState
  }
  /**
   * Фокус вошёл в правую панель или ушёл из неё: ⌘W меню тогда закрывает вкладку
   * разговора, а не окно (событие claude:panelKey).
   */
  'claude:setPanelFocus': { request: { focused: boolean }; response: void }
}

export type ClaudeTabsEventContract = {
  /** Клавиша панели, которую поймало меню приложения (⌘W при фокусе в панели). */
  'claude:panelKey': PanelKeyCommand
}

/** Каналы этой части в рантайме: их разворачивает INVOKE_CHANNELS. */
export const CLAUDE_TABS_CHANNELS = {
  'claude:closeConversation': true,
  'claude:reopenClosed': true,
  'claude:rename': true,
  'claude:moveTab': true,
  'claude:moveGroup': true,
  'claude:setPanelFocus': true,
} satisfies Record<keyof ClaudeTabsInvokeContract, true>

/** События этой части: их разворачивает EVENT_CHANNELS. */
export const CLAUDE_TABS_EVENTS = {
  'claude:panelKey': true,
} satisfies Record<keyof ClaudeTabsEventContract, true>
