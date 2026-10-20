import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { Conversation } from '@shared/claude'
import type { McpAction, McpServer, McpAddRequest } from '@shared/claude-tools'
import { useQueryClient } from '@tanstack/react-query'

import { useMcpServers, useToolsAction } from '../claude-tools.queries'
import { invoke } from '../../../lib/ipc'
import { QUERY_KEYS } from '../../../state/query-keys'
import { AUTH_RECHECK_MS } from './McpScreen.constants'
import type { McpCommand } from './McpScreen.types'
import { addScopeOf } from './McpScreen.utils'

/**
 * Экран MCP: список серверов у процесса разговора и действия с ними; каждое действие
 * отвечает и списком после себя. Сам список переспрашивается в двух случаях: после
 * входа в браузере (CLI переподключает сервер молча) и когда ход кончился (добавленный
 * посреди хода сервер процесс подхватывает после него).
 */
export const useMcpScreen = (conversation: Conversation) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { id: conversationId, status } = conversation
  const listing = useMcpServers(conversationId)
  const timers = useRef<number[]>([])
  const wasBusy = useRef(status !== 'idle')

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  useEffect(() => {
    if (status === 'idle' && wasBusy.current) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpServers(conversationId) })
    }

    wasBusy.current = status !== 'idle'
  }, [status, conversationId, queryClient])

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpServers(conversationId) })

  const action = useToolsAction({
    run: (command: McpCommand) => {
      const { name } = command.server

      switch (command.kind) {
        case 'add':
          return invoke('mcp:add', { conversationId, server: command.server })
        case 'remove':
          return invoke('mcp:remove', { conversationId, name, scope: command.scope })
        case 'act':
          return invoke('mcp:act', { conversationId, name, action: command.action })
      }
    },
    describe: (command) => ({
      target: command.kind === 'add' ? 'add' : command.server.name,
      success: t(`claudeCode.mcp.done.${command.kind === 'act' ? command.action : command.kind}`, {
        name: command.server.name,
      }),
    }),
    apply: ({ listing: next }) =>
      queryClient.setQueryData(QUERY_KEYS.mcpServers(conversationId), next),
  })

  const act = async (server: McpServer, kind: McpAction) => {
    const result = await action.start({ kind: 'act', server, action: kind })

    if (result?.signIn !== 'browser') return

    action.setNotice({
      tone: 'info',
      text: t('claudeCode.mcp.finishInBrowser', { name: server.name }),
    })

    for (const delay of AUTH_RECHECK_MS) timers.current.push(window.setTimeout(refresh, delay))
  }

  return {
    listing,
    busy: action.busy,
    notice: action.notice,
    refresh,
    act: (server: McpServer, kind: McpAction) => void act(server, kind),
    add: (server: McpAddRequest) => void action.start({ kind: 'add', server }),
    remove: (server: McpServer) => {
      const scope = addScopeOf(server.scope)

      if (scope) void action.start({ kind: 'remove', server, scope })
    },
  }
}
