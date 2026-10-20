import { it, vi, expect, describe, beforeEach } from 'vitest'

import type { ConversationRuntime } from '../conversation/conversation-runtime'
import { runCli } from './cli-run'
import { McpTools } from './mcp-tools'
import { PluginTools } from './plugin-tools'
import type { ToolsHost } from './tools-host'

vi.mock('./cli-run', () => ({ runCli: vi.fn() }))

/** Разговор без процесса: только папка и перезапуск. */
const fakeRuntime = (id: string, projectPath: string, restartProcess: () => void) =>
  ({
    meta: { id, projectPath, error: null },
    restartProcess,
    prepareProcess: vi.fn(() => Promise.resolve(null)),
    scheduleSleep: vi.fn(),
  }) as unknown as ConversationRuntime

const makeHost = (trusted: boolean) => {
  const restarts = [vi.fn(), vi.fn()] as const
  const runtimes = [fakeRuntime('a', '/one', restarts[0]), fakeRuntime('b', '/two', restarts[1])]
  const host: ToolsHost = {
    runtime: (id) => runtimes.find((runtime) => runtime.meta.id === id) ?? runtimes[0]!,
    runtimes: () => runtimes,
    cli: () =>
      Promise.resolve({
        binary: 'claude',
        env: {},
        features: {
          manualMode: true,
          allowSkipPermissions: true,
          safeMode: true,
          settingSources: true,
        },
      }),
    isTrusted: () => Promise.resolve(trusted),
    onCommands: () => undefined,
    openExternal: () => true,
  }

  return { host, restarts }
}

beforeEach(() => {
  vi.mocked(runCli).mockReset()
  vi.mocked(runCli).mockResolvedValue({ code: 0, stdout: 'ok', stderr: '', timedOut: false })
})

describe('изменение MCP-серверов', () => {
  it('сервер «для меня везде» перезапускает разговоры всех проектов', async () => {
    const { host, restarts } = makeHost(true)

    await new McpTools(host).remove('a', 'srv', 'user')

    for (const restart of restarts) expect(restart).toHaveBeenCalled()
    expect(vi.mocked(runCli).mock.calls[0]?.[1]).toEqual([
      'mcp',
      'remove',
      '-s',
      'user',
      '--',
      'srv',
    ])
  })

  it('проектный - только разговоры своего проекта', async () => {
    const { host, restarts } = makeHost(true)

    await new McpTools(host).remove('a', 'srv', 'local')

    expect(restarts[0]).toHaveBeenCalled()
    expect(restarts[1]).not.toHaveBeenCalled()
  })

  it('в недоверенной папке CLI не запускается', async () => {
    const { host } = makeHost(false)
    const { result } = await new McpTools(host).remove('a', 'srv', 'project')

    expect(result.failure).toBe('untrusted')
    expect(runCli).not.toHaveBeenCalled()
  })

  it('незакрытая кавычка в команде - отказ до CLI', async () => {
    const { host } = makeHost(true)
    const { result } = await new McpTools(host).add('a', {
      name: 'srv',
      transport: 'stdio',
      target: 'npx "broken',
      scope: 'user',
    })

    expect(result.failure).toBe('bad-command')
    expect(runCli).not.toHaveBeenCalled()
  })
})

describe('плагины', () => {
  it('каталог недоверенной папки не читается, свои маркетплейсы - из домашней папки', async () => {
    const { host } = makeHost(false)
    const plugins = new PluginTools(host)

    expect((await plugins.catalog('/one')).failure).toBe('untrusted')
    expect(runCli).not.toHaveBeenCalled()

    const { result } = await plugins.removeMarketplace('/one', 'team')

    expect(result.ok).toBe(true)
    expect(vi.mocked(runCli).mock.calls[0]?.[2]).not.toBe('/one')
  })

  it('плагин проекта в недоверенной папке - отказ, для себя - можно', async () => {
    const { host } = makeHost(false)
    const plugins = new PluginTools(host)

    expect(
      (await plugins.act('/one', 'enable', 'lint@team', 'project', false)).result.failure,
    ).toBe('untrusted')
    expect((await plugins.act('/one', 'install', 'lint@team', '', false)).result.ok).toBe(true)
  })
})
