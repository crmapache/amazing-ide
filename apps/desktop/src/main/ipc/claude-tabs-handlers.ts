import type { ClaudeTabsInvokeContract } from '@shared/ipc/claude-tabs.contract'

import type { ClaudeService } from '../claude/claude-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import { setPanelFocused } from '../claude/tabs/panel-focus'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type TabChannels = Exclude<keyof ClaudeTabsInvokeContract, `git:${string}`>

/** id вкладки, группы или соседа; null - «в конец». */
const idOrNull = (value: unknown, name: string): string | null => {
  if (value === null) return null

  assertString(value, name)

  return value
}

const idOf = (value: unknown, name: string): string => {
  assertString(value, name)

  return value
}

/**
 * Каналы полосы вкладок разговоров: закрытие и возврат, имя, перестановка, фокус
 * панели. Проект - по id открытой вкладки проекта, остальное - сервис main/claude/tabs.
 */
export const createClaudeTabsHandlers = (
  workspace: WorkspaceService,
  claude: ClaudeService,
): Pick<InvokeHandlers, TabChannels> => ({
  'claude:closeConversation': ({ conversationId, hasDraft }) =>
    claude.tabs.close(idOf(conversationId, 'conversationId'), hasDraft === true),
  'claude:reopenClosed': ({ projectId, closedId }) =>
    claude.tabs.reopen(projectRootOf(workspace, projectId), idOrNull(closedId, 'closedId')),
  'claude:rename': ({ conversationId, title }) => {
    assertString(title, 'title')

    // Длину и вид имени приводит сервис (tabs/tab-names.ts): окно присылает как набрано.
    return claude.tabs.rename(idOf(conversationId, 'conversationId'), title)
  },
  'claude:moveTab': ({ conversationId, beforeId }) =>
    claude.tabs.moveTab(idOf(conversationId, 'conversationId'), idOrNull(beforeId, 'beforeId')),
  'claude:moveGroup': ({ groupId, beforeId }) =>
    claude.tabs.moveGroup(idOf(groupId, 'groupId'), idOrNull(beforeId, 'beforeId')),
  'claude:setPanelFocus': ({ focused }) => setPanelFocused(focused === true),
})
