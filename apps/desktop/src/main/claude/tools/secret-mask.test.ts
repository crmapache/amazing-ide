import { it, expect, describe } from 'vitest'

import { maskUrl, maskArgs, maskText } from './secret-mask'

describe('ключи не уходят в окно', () => {
  it('адрес - без логина, строки запроса и ключа в пути', () => {
    expect(maskUrl('https://u:tok@mcp.example.com/mcp?token=x#y')).toBe(
      'https://mcp.example.com/mcp',
    )
    expect(maskUrl('https://actions.zapier.com/mcp/sk-ak-a1B2c3D4e5F6g7H8i9J0k1L2/sse')).toBe(
      'https://actions.zapier.com/mcp/•••/sse',
    )
    expect(maskUrl('https://github.com/anthropics/claude-plugins')).toBe(
      'https://github.com/anthropics/claude-plugins',
    )
  })

  it('аргументы: значение ключевого флага, пара ИМЯ=значение, ключ сам по себе', () => {
    expect(
      maskArgs([
        'npx',
        '-y',
        '@scope/server',
        '--api-key',
        'abc',
        '--token=xyz',
        'GITHUB_TOKEN=ghp_1234567890abcdefghij',
        'sk-proj-1234567890abcdef',
        '--dir',
        '/Users/me/My Docs',
      ]),
    ).toEqual([
      'npx',
      '-y',
      '@scope/server',
      '--api-key',
      '•••',
      '--token=•••',
      'GITHUB_TOKEN=•••',
      '•••',
      '--dir',
      '/Users/me/My Docs',
    ])
  })

  it('текст CLI: адреса, пары и Bearer маской, обычные слова как есть', () => {
    expect(
      maskText(
        'Failed to connect to https://a:b@host.io/v1/a1b2c3d4e5f6g7h8i9j0k1l2m3?key=1 (api_key=secret, Authorization: Bearer abc.def)',
      ),
    ).toBe('Failed to connect to https://host.io/v1/••• (api_key=•••, Authorization: Bearer •••)')
    expect(maskText('Server "github" exited with code 1')).toBe(
      'Server "github" exited with code 1',
    )
  })
})
