import { homedir } from 'node:os'

import type {
  McpAction,
  McpListing,
  McpOutcome,
  McpAddScope,
  ToolsResult,
  McpAddRequest,
} from '@shared/claude-tools'

import { isRecord, stringField } from '../cli/cli-messages'
import type { ConversationRuntime } from '../conversation/conversation-runtime'
import { runCli } from './cli-run'
import { splitCommandLine, serversFromStatus } from './mcp-servers'
import type { ToolsHost } from './tools-host'
import { failed, resultOf, failureOf } from './tools-result'

const MCP_REQUESTS: Record<McpAction, (serverName: string) => Record<string, unknown>> = {
  reconnect: (serverName) => ({ subtype: 'mcp_reconnect', serverName }),
  enable: (serverName) => ({ subtype: 'mcp_toggle', serverName, enabled: true }),
  disable: (serverName) => ({ subtype: 'mcp_toggle', serverName, enabled: false }),
  authenticate: (serverName) => ({ subtype: 'mcp_authenticate', serverName }),
}

/**
 * MCP-серверы проекта. Состояние, переподключение, включение и вход - у живого
 * процесса разговора (он и держит серверы); добавление и удаление - разовыми командами
 * CLI. Конфиг MCP CLI читает только на старте - после изменения процессы
 * перезапускаются, как только свободны. Каждое действие отвечает и списком после него.
 */
export class McpTools {
  constructor(private readonly host: ToolsHost) {}

  async list(conversationId: string): Promise<McpListing> {
    const runtime = this.host.runtime(conversationId)
    const process = await runtime.prepareProcess()

    if (!process) return { servers: [], failure: runtime.meta.error ?? 'failed', detail: '' }

    try {
      const reply = await process.control({ subtype: 'mcp_status' })

      return { servers: serversFromStatus(reply), failure: null, detail: '' }
    } catch (error) {
      return { servers: [], ...failureOf(error) }
    } finally {
      runtime.scheduleSleep()
    }
  }

  async act(conversationId: string, name: string, action: McpAction): Promise<McpOutcome> {
    const result = await this.request(this.host.runtime(conversationId), name, action)

    return { result, listing: await this.list(conversationId) }
  }

  async add(conversationId: string, request: McpAddRequest): Promise<McpOutcome> {
    const command = request.transport === 'stdio' ? splitCommandLine(request.target) : null

    if (request.transport === 'stdio' && !command) {
      return { result: failed('bad-command'), listing: await this.list(conversationId) }
    }

    const target = command ? ['--', ...command] : [request.target]

    return this.change(conversationId, request.scope, [
      'mcp',
      'add',
      '-s',
      request.scope,
      '-t',
      request.transport,
      request.name,
      ...target,
    ])
  }

  remove(conversationId: string, name: string, scope: McpAddScope): Promise<McpOutcome> {
    return this.change(conversationId, scope, ['mcp', 'remove', '-s', scope, '--', name])
  }

  /** Запрос к процессу разговора. Вход заканчивается в браузере: CLI ждёт возврата сам. */
  private async request(
    runtime: ConversationRuntime,
    name: string,
    action: McpAction,
  ): Promise<ToolsResult> {
    const process = await runtime.prepareProcess()

    if (!process) return failed(runtime.meta.error ?? 'failed')

    try {
      const reply = await process.control(MCP_REQUESTS[action](name))
      const authUrl = isRecord(reply) ? stringField(reply, 'authUrl') : ''

      // Адрес входа диктует сервер, а он мог прийти из чужого репозитория: только сайт.
      if (authUrl && !this.host.openExternal(authUrl)) return failed('unsafe-url')

      return {
        ok: true,
        failure: null,
        detail: '',
        needsConsent: false,
        signIn: action === 'authenticate' ? (authUrl ? 'browser' : 'done') : undefined,
      }
    } catch (error) {
      return { ...failed('failed'), ...failureOf(error) }
    } finally {
      runtime.scheduleSleep()
    }
  }

  /**
   * Добавить или убрать сервер. Свой для всех проектов (user) - из домашней папки и с
   * перезапуском всех разговоров; проектный и локальный - в папке проекта, только если
   * ей доверились (CLI читает её настройки), и с перезапуском разговоров этого проекта.
   */
  private async change(
    conversationId: string,
    scope: McpAddScope,
    args: string[],
  ): Promise<McpOutcome> {
    const { projectPath } = this.host.runtime(conversationId).meta
    const isUser = scope === 'user'
    const outcome = async (result: ToolsResult) => ({
      result,
      listing: await this.list(conversationId),
    })

    if (!isUser && !(await this.host.isTrusted(projectPath))) return outcome(failed('untrusted'))

    const cli = await this.host.cli()

    if (!cli) return outcome(failed('cli-not-found'))

    const result = resultOf(await runCli(cli, args, isUser ? homedir() : projectPath))

    if (result.ok) {
      for (const runtime of this.host.runtimes()) {
        if (isUser || runtime.meta.projectPath === projectPath) runtime.restartProcess()
      }
    }

    return outcome(result)
  }
}
