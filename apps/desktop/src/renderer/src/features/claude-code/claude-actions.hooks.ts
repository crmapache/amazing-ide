import { useMemo } from 'react'

import type { ClaudeState, RequestResponse, ConversationOptions } from '@shared/claude'
import type { PanelPrefsPatch } from '@shared/claude-prefs'
import type { RewindScope } from '@shared/claude-rewind'
import { useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'
import type { ComposerDraft, OutgoingMessage } from './draft.types'
import { applyDraft } from './field-bus'

/**
 * Действия над разговорами Claude Code. Ответ главного процесса - состояние целиком,
 * оно сразу ложится в кэш (ADR 0003). Ошибка канала пишется в журнал окна: это сбой
 * связи с главным процессом, а не то, что человек может исправить; действие тогда
 * возвращает null. Объект действий один на всё время жизни компонента.
 */
export const useClaudeActions = () => {
  const queryClient = useQueryClient()

  return useMemo(() => {
    const run = (request: Promise<ClaudeState>) =>
      request
        .then((state) => {
          queryClient.setQueryData(QUERY_KEYS.claudeState, state)

          return state
        })
        .catch((error: unknown) => {
          console.warn('[claude-code] действие не выполнено:', error)

          return null
        })

    return {
      newConversation: (projectId: string) => run(invoke('claude:newConversation', { projectId })),
      /** Закрыть вкладку; hasDraft - в поле что-то написано, вкладку стоит помнить. */
      closeConversation: (conversationId: string, hasDraft = false) =>
        run(invoke('claude:closeConversation', { conversationId, hasDraft })),
      activateConversation: (conversationId: string) =>
        run(invoke('claude:activateConversation', { conversationId })),
      /** Вернуть закрытую вкладку на её место; closedId null - последнюю закрытую. */
      reopenClosed: (projectId: string, closedId: string | null = null) =>
        run(invoke('claude:reopenClosed', { projectId, closedId })),
      /** Имя от человека: перебивает любое и уходит в транскрипт (`/rename` - сюда же). */
      rename: (conversationId: string, title: string) =>
        run(invoke('claude:rename', { conversationId, title })),
      /** Группу форков целиком - перед группой beforeId, null - в конец полосы. */
      moveGroup: (groupId: string, beforeId: string | null) =>
        run(invoke('claude:moveGroup', { groupId, beforeId })),
      moveTab: (conversationId: string, beforeId: string | null) =>
        run(invoke('claude:moveTab', { conversationId, beforeId })),
      send: (conversationId: string, message: OutgoingMessage) =>
        run(invoke('claude:send', { conversationId, ...message })),
      /** before - сосед в очереди, перед которым встать (сообщение вынимали поправить). */
      enqueue: (conversationId: string, message: OutgoingMessage, before: string | null = null) =>
        run(invoke('claude:enqueue', { conversationId, ...message, before })),
      /** Вынуть сообщение очереди в поле: состояние - в кэш, само сообщение - тому, кто нажал. */
      takeQueued: (conversationId: string, queuedId: string) =>
        invoke('claude:takeQueued', { conversationId, queuedId })
          .then(({ state, taken }) => {
            queryClient.setQueryData(QUERY_KEYS.claudeState, state)

            return taken
          })
          .catch((error: unknown) => {
            console.warn('[claude-code] сообщение очереди не вынуто:', error)

            return null
          }),
      moveQueued: (conversationId: string, queuedId: string, toIndex: number) =>
        run(invoke('claude:moveQueued', { conversationId, queuedId, toIndex })),
      removeQueued: (conversationId: string, queuedId: string) =>
        run(invoke('claude:removeQueued', { conversationId, queuedId })),
      sendQueued: (conversationId: string, queuedId: string) =>
        run(invoke('claude:sendQueued', { conversationId, queuedId })),
      trustProject: (projectId: string) => run(invoke('claude:trustProject', { projectId })),
      interrupt: (conversationId: string) => run(invoke('claude:interrupt', { conversationId })),
      forceStop: (conversationId: string) => run(invoke('claude:forceStop', { conversationId })),
      respond: (conversationId: string, requestId: string, response: RequestResponse) =>
        run(invoke('claude:respond', { conversationId, requestId, response })),
      setOptions: (conversationId: string, options: ConversationOptions) =>
        run(invoke('claude:setOptions', { conversationId, options })),
      openHistory: (projectId: string, sessionId: string) =>
        run(invoke('claude:openHistory', { projectId, sessionId })),
      recheckCli: () => run(invoke('claude:recheckCli')),
      setPrefs: (patch: PanelPrefsPatch) => run(invoke('claude:setPrefs', { patch })),
      accounts: {
        refresh: () => run(invoke('accounts:refresh')),
        refreshUsage: (accountIds: string[]) =>
          run(invoke('accounts:refreshUsage', { accountIds })),
        add: () => run(invoke('accounts:add')),
        signIn: (accountId: string) => run(invoke('accounts:signIn', { accountId })),
        cancelSignIn: () => run(invoke('accounts:cancelSignIn')),
        select: (accountId: string) => run(invoke('accounts:select', { accountId })),
        rename: (accountId: string, alias: string) =>
          run(invoke('accounts:rename', { accountId, alias })),
        forget: (accountId: string) => run(invoke('accounts:forget', { accountId })),
        logout: () => run(invoke('accounts:logout')),
        import: (sourceId: string) => run(invoke('accounts:import', { sourceId })),
      },
      revertChanges: (
        conversationId: string,
        turnId: string,
        path: string | null,
        restore: boolean,
      ) => run(invoke('claude:revertChanges', { conversationId, turnId, path, restore })),
      runShell: (conversationId: string, command: string) =>
        run(invoke('claude:runShell', { conversationId, command })),
      stopShell: (conversationId: string, runId: string) =>
        run(invoke('claude:stopShell', { conversationId, runId })),
      /** /status: строка SESSION в ленте разговора. */
      showSessionInfo: (conversationId: string) =>
        run(invoke('claude:showSessionInfo', { conversationId })),
      /**
       * Форк в новой вкладке. draft - сообщение, перед которым режут, кусками поля (чипы,
       * картинки, цитаты): оно ждёт в поле форка, его и собирались написать иначе.
       */
      fork: async (
        conversationId: string,
        beforeMessageId: string | null,
        draft: ComposerDraft | null = null,
      ) => {
        const state = await run(invoke('claude:fork', { conversationId, beforeMessageId }))
        const source = state?.conversations.find((item) => item.id === conversationId)
        const forkId = source && state?.activeByProject[source.projectPath]

        if (forkId && draft) applyDraft(forkId, draft)

        return state
      },
      /** Откат: состояние - в кэш, итог - тому, кто нажал. Сбой связи - null. */
      rewind: (conversationId: string, messageId: string, scope: RewindScope) =>
        invoke('claude:rewind', { conversationId, messageId, scope })
          .then(({ state, outcome }) => {
            queryClient.setQueryData(QUERY_KEYS.claudeState, state)

            return outcome
          })
          .catch((error: unknown) => {
            console.warn('[claude-code] откат не выполнен:', error)

            return null
          }),
    }
  }, [queryClient])
}
