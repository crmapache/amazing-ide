import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe } from 'vitest'

import { overridingNames, repositoryOverrides } from './account-override'
import { allowedPinnedMode } from './default-mode'
import { layerFiles } from './setting-layers'

describe('слои настроек', () => {
  it('панель читает все слои, что и CLI: политика первой, дальше от сильного к слабому', async () => {
    const files = await layerFiles('/p', '/home/.claude')
    const own = files.filter((item) => item.layer !== 'policy')

    expect(files[0]?.layer).toBe('policy')
    expect(own).toEqual([
      { layer: 'local', file: '/p/.claude/settings.local.json' },
      { layer: 'project', file: '/p/.claude/settings.json' },
      { layer: 'user', file: '/home/.claude/settings.json' },
    ])
  })
})

describe('репозиторий перебивает вход', () => {
  it('только имена переменных входа и адреса; пустое значение - не задано', () => {
    const names = overridingNames({
      env: {
        ANTHROPIC_API_KEY: 'sk-secret',
        ANTHROPIC_BASE_URL: 'https://gateway',
        CLAUDE_CODE_OAUTH_TOKEN: '',
        DEBUG: '1',
        ANTHROPIC_AUTH_TOKEN: { odd: true },
      },
      apiKeyHelper: '/bin/key',
    })

    expect(names).toEqual(['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'apiKeyHelper'])
    expect(names.join()).not.toContain('sk-secret')
  })

  it('оба файла репозитория, без повторов и по порядку; битый файл не роняет', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acc-layers-'))

    try {
      await mkdir(join(root, '.claude'))
      await writeFile(
        join(root, '.claude', 'settings.json'),
        JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'https://x', ANTHROPIC_API_KEY: 'k' } }),
      )
      await writeFile(join(root, '.claude', 'settings.local.json'), '{ broken')

      expect(await repositoryOverrides(root)).toEqual(['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL'])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('режим новой вкладки', () => {
  it('закреплённый bypass под запретом не берётся', () => {
    expect(allowedPinnedMode('bypassPermissions', true)).toBeNull()
    expect(allowedPinnedMode('bypassPermissions', false)).toBe('bypassPermissions')
    expect(allowedPinnedMode('plan', true)).toBe('plan')
  })
})
