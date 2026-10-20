import type { McpScope, McpServer, McpAddScope } from '@shared/claude-tools'
import { MCP_ADD_SCOPES } from '@shared/claude-tools'

import { SCOPE_ORDER } from './McpScreen.constants'
import type { McpGroup } from './McpScreen.types'

/** Серверы группами по месту настройки, в порядке терминального /mcp; пустых групп нет. */
export const groupServers = (servers: readonly McpServer[]): McpGroup[] =>
  SCOPE_ORDER.map((scope) => ({
    scope,
    servers: servers.filter((server) => server.scope === scope),
  })).filter((group) => group.servers.length > 0)

/** Область, из которой сервер можно удалить: своё - да, claude.ai и встроенные - нет. */
export const addScopeOf = (scope: McpScope): McpAddScope | null =>
  MCP_ADD_SCOPES.find((value) => value === scope) ?? null
