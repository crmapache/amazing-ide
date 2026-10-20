import type { McpAddRequest } from '@shared/claude-tools'
import { PLUGIN_SCOPES, MCP_ADD_SCOPES, MCP_TRANSPORTS } from '@shared/claude-tools'

import type { ClaudeService } from '../claude/claude-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertOneOf, assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type ToolsChannels = Extract<keyof InvokeHandlers, `mcp:${string}` | `plugins:${string}`>

/**
 * Имя сервера, плагина или маркетплейса уходит аргументом CLI: только безопасные
 * символы и не с дефиса - иначе окно подсунуло бы CLI флаг вместо имени.
 */
const NAME_PATTERN = /^[\w.@:/-]{1,200}$/

const assertName = (value: unknown, field: string): string => {
  assertString(value, field)

  if (!NAME_PATTERN.test(value) || value.startsWith('-')) {
    throw new Error(`Недопустимое имя в поле ${field}`)
  }

  return value
}

/**
 * Источник маркетплейса: адрес, путь или owner/repo. Проверяется уже обрезанным - иначе
 * « --scope» прошёл бы проверку и доехал до CLI флагом. Без переводов строк и нулевого
 * байта: аргументы запуска CLI их не переносят.
 */
const assertSource = (value: unknown): string => {
  assertString(value, 'source')

  const source = value.trim()

  if (!source || source.length > 500 || source.startsWith('-') || /[\0\r\n]/.test(source)) {
    throw new Error('Недопустимый источник маркетплейса')
  }

  return source
}

const parseServer = (value: unknown): McpAddRequest => {
  if (typeof value !== 'object' || value === null) throw new Error('Ожидался сервер')

  const record = value as Record<string, unknown>
  const transport = assertOneOf(record['transport'], MCP_TRANSPORTS, 'transport')
  const target = record['target']

  assertString(target, 'target')

  if (!target.trim() || target.length > 2000 || /[\0\r\n]/.test(target)) {
    throw new Error('Недопустимая команда или адрес')
  }

  if (transport !== 'stdio' && !/^https?:\/\//i.test(target.trim())) {
    throw new Error('Адрес сервера - http или https')
  }

  return {
    name: assertName(record['name'], 'name'),
    transport,
    target: target.trim(),
    scope: assertOneOf(record['scope'], MCP_ADD_SCOPES, 'scope'),
  }
}

/** Каналы MCP и плагинов: проверить вход, позвать ClaudeTools. */
export const createClaudeToolsHandlers = (
  workspace: WorkspaceService,
  claude: ClaudeService,
): Pick<InvokeHandlers, ToolsChannels> => {
  const root = (projectId: unknown) => projectRootOf(workspace, projectId)
  const id = (conversationId: unknown) => {
    assertString(conversationId, 'conversationId')

    return conversationId
  }
  const { mcp, plugins } = claude

  return {
    'mcp:list': ({ conversationId }) => mcp.list(id(conversationId)),
    'mcp:act': ({ conversationId, name, action }) =>
      mcp.act(
        id(conversationId),
        assertName(name, 'name'),
        assertOneOf(action, ['reconnect', 'enable', 'disable', 'authenticate'], 'action'),
      ),
    'mcp:add': ({ conversationId, server }) => mcp.add(id(conversationId), parseServer(server)),
    'mcp:remove': ({ conversationId, name, scope }) =>
      mcp.remove(
        id(conversationId),
        assertName(name, 'name'),
        assertOneOf(scope, MCP_ADD_SCOPES, 'scope'),
      ),
    'plugins:catalog': ({ projectId }) => plugins.catalog(root(projectId)),
    'plugins:act': ({ projectId, action, pluginId, scope, consent }) =>
      plugins.act(
        root(projectId),
        assertOneOf(action, ['install', 'uninstall', 'enable', 'disable', 'update'], 'action'),
        assertName(pluginId, 'pluginId'),
        scope === '' ? '' : assertOneOf(scope, PLUGIN_SCOPES, 'scope'),
        consent === true,
      ),
    'plugins:addMarketplace': ({ projectId, source }) =>
      plugins.addMarketplace(root(projectId), assertSource(source)),
    'plugins:removeMarketplace': ({ projectId, name }) =>
      plugins.removeMarketplace(root(projectId), assertName(name, 'name')),
  }
}
