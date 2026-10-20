import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe } from 'vitest'

import { launchOverrides, overridingNames, repositoryOverrides } from './account-override'
import { allowedPinnedMode } from './default-mode'
import { layerFiles, loadedLayers, settingSourcesArg } from './setting-layers'

describe('источники настроек', () => {
  it('аргумент флага - словами CLI, «все» - без флага', () => {
    expect(settingSourcesArg('all')).toBeNull()
    expect(settingSourcesArg('noLocal')).toBe('user,project')
    expect(settingSourcesArg('user')).toBe('user')
  })

  it('политика организации читается при любом выборе', () => {
    expect(loadedLayers('user')).toEqual(['policy', 'user'])
    expect(loadedLayers('noLocal')).toEqual(['policy', 'project', 'user'])
    expect(loadedLayers('all')).toEqual(['policy', 'local', 'project', 'user'])
  })

  it('панель читает те же файлы, с которыми запускает: без локального - его не читает', async () => {
    const files = await layerFiles('/p', '/home/.claude', 'noLocal')
    const own = files.filter((item) => item.layer !== 'policy')

    expect(own).toEqual([
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

  it('у запущенного процесса - только переданные слои; CLI без флага читает репозиторий', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acc-layers-'))

    try {
      await mkdir(join(root, '.claude'))
      await writeFile(
        join(root, '.claude', 'settings.local.json'),
        JSON.stringify({ env: { ANTHROPIC_API_KEY: 'k' } }),
      )

      expect(await launchOverrides(root, 'all', true)).toEqual(['ANTHROPIC_API_KEY'])
      expect(await launchOverrides(root, 'noLocal', true)).toEqual([])
      expect(await launchOverrides(root, 'user', false)).toEqual(['ANTHROPIC_API_KEY'])
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
