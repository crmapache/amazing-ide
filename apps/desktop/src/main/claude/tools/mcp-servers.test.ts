import { it, expect, describe } from 'vitest'

import { splitCommandLine, serversFromStatus } from './mcp-servers'

describe('MCP-серверы из ответа CLI', () => {
  it('ключи окружения и заголовков в окно не уходят, адрес - без строки запроса', () => {
    const servers = serversFromStatus({
      mcpServers: [
        {
          name: 'local',
          status: 'connected',
          scope: 'user',
          config: { type: 'stdio', command: 'npx', args: ['-y', 'pkg'], env: { KEY: 'secret' } },
          tools: [{}, {}],
        },
        {
          name: 'remote',
          status: 'needs-auth',
          scope: 'dynamic',
          config: {
            type: 'http',
            url: 'https://u:p@mcp.example.com/mcp?token=secret',
            headers: { Authorization: 'x' },
          },
        },
        { name: 'odd', status: 'sleeping', scope: 'enterprise', config: {} },
      ],
    })

    expect(servers).toEqual([
      {
        name: 'local',
        status: 'connected',
        scope: 'user',
        transport: 'stdio',
        target: 'npx -y pkg',
        error: '',
        toolCount: 2,
        removable: true,
      },
      {
        name: 'remote',
        status: 'needs-auth',
        scope: 'dynamic',
        transport: 'http',
        target: 'https://mcp.example.com/mcp',
        error: '',
        toolCount: 0,
        removable: false,
      },
      {
        name: 'odd',
        status: 'unknown',
        scope: 'other',
        transport: 'stdio',
        target: '',
        error: '',
        toolCount: 0,
        removable: false,
      },
    ])
    expect(JSON.stringify(servers)).not.toContain('secret')
  })

  it('строка команды делится как в shell', () => {
    expect(splitCommandLine(`npx -y "@scope/pkg" --dir '/My Docs'  x`)).toEqual([
      'npx',
      '-y',
      '@scope/pkg',
      '--dir',
      '/My Docs',
      'x',
    ])
    expect(splitCommandLine('a ""')).toEqual(['a', ''])
  })

  it('обратная косая черта держит знак, незакрытая кавычка - отказ', () => {
    expect(splitCommandLine('node /My\\ Docs/server.js "say \\"hi\\""')).toEqual([
      'node',
      '/My Docs/server.js',
      'say "hi"',
    ])
    expect(splitCommandLine("run 'C:\\path'")).toEqual(['run', 'C:\\path'])
    expect(splitCommandLine('npx "unclosed')).toBeNull()
    expect(splitCommandLine('npx trailing\\')).toBeNull()
  })

  it('ключ в аргументах и в пути адреса - маской', () => {
    const [stdio, http] = serversFromStatus({
      mcpServers: [
        {
          name: 'a',
          status: 'connected',
          scope: 'user',
          config: { command: 'npx', args: ['srv', '--api-key', 'k-1'] },
        },
        {
          name: 'b',
          status: 'failed',
          scope: 'user',
          config: { type: 'sse', url: 'https://x.io/mcp/a1b2c3d4e5f6g7h8i9j0k1l2/sse' },
          error: 'GET https://x.io/mcp/a1b2c3d4e5f6g7h8i9j0k1l2/sse failed',
        },
      ],
    })

    expect(stdio?.target).toBe('npx srv --api-key •••')
    expect(http?.target).toBe('https://x.io/mcp/•••/sse')
    expect(http?.error).toBe('GET https://x.io/mcp/•••/sse failed')
  })
})
