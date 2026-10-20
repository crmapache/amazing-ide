import type { McpScope, McpServer, McpStatus } from '@shared/claude-tools'
import { MCP_SCOPES } from '@shared/claude-tools'

import { isRecord, recordField, stringField, recordsField } from '../cli/cli-messages'
import { maskUrl, maskArgs, maskText } from './secret-mask'

const STATUSES: readonly McpStatus[] = ['connected', 'pending', 'failed', 'needs-auth', 'disabled']

const REMOVABLE: ReadonlySet<McpScope> = new Set(['project', 'local', 'user'])

/**
 * Что запускает сервер - команда с аргументами или адрес, без окружения и заголовков,
 * ключи в аргументах и в пути адреса - маской.
 */
const targetOf = (config: Record<string, unknown>) => {
  const url = stringField(config, 'url')

  if (url) return maskUrl(url)

  const args = Array.isArray(config['args'])
    ? config['args'].filter((arg): arg is string => typeof arg === 'string')
    : []

  return [stringField(config, 'command'), ...maskArgs(args)].filter(Boolean).join(' ')
}

/**
 * Серверы из ответа CLI на mcp_status. Конфиг сервера несёт env и headers с ключами -
 * в окно уходит только команда или адрес; ошибка - тоже без ключей (в ней бывает адрес).
 */
export const serversFromStatus = (reply: unknown): McpServer[] =>
  isRecord(reply)
    ? recordsField(reply, 'mcpServers')
        .map((server) => {
          const config = recordField(server, 'config')
          const status = STATUSES.find((value) => value === server['status']) ?? 'unknown'
          const scope: McpScope = MCP_SCOPES.find((value) => value === server['scope']) ?? 'other'

          return {
            name: stringField(server, 'name'),
            status,
            scope,
            transport: stringField(config, 'type') || 'stdio',
            target: targetOf(config),
            error: maskText(stringField(server, 'error')),
            toolCount: Array.isArray(server['tools']) ? server['tools'].length : 0,
            removable: REMOVABLE.has(scope),
          }
        })
        .filter((server) => server.name.length > 0)
    : []

/**
 * Строка команды stdio-сервера - аргументами, как их разобрал бы shell: кавычки держат
 * пробелы, обратная косая черта - следующий знак (путь из терминала «My\ Docs»; в
 * одинарных кавычках она обычный знак). CLI сам строку не делит, а целиком она стала бы
 * именем программы. Незакрытая кавычка - null: сервер зарегистрировался бы сломанным.
 */
export const splitCommandLine = (line: string): string[] | null => {
  const args: string[] = []
  let current = ''
  let quote: string | null = null
  let started = false
  let escaped = false

  for (const char of line.trim()) {
    if (escaped) {
      current += char
      escaped = false
    } else if (char === '\\' && quote !== "'") {
      escaped = true
      started = true
    } else if (quote) {
      if (char === quote) quote = null
      else current += char
    } else if (char === '"' || char === "'") {
      quote = char
      started = true
    } else if (/\s/.test(char)) {
      if (started) args.push(current)

      current = ''
      started = false
    } else {
      current += char
      started = true
    }
  }

  if (quote || escaped) return null
  if (started) args.push(current)

  return args
}
