import { it, expect, describe } from 'vitest'

import { installedFor, parseCliJson, marketplacesOf, availablePlugins } from './plugin-catalog'

describe('каталог плагинов из вывода CLI', () => {
  it('JSON после предупреждений читается, мусор - null', () => {
    expect(parseCliJson('warning: old cache\n{"a":1}')).toEqual({ a: 1 })
    expect(parseCliJson('nothing')).toBeNull()
  })

  it('установленные - свои и этого проекта, чужие проекты - мимо', () => {
    const reply = {
      installed: [
        { id: 'context7@official', version: '1', scope: 'user', enabled: true },
        { id: 'slack@official', scope: 'local', enabled: false, projectPath: '/other' },
        { id: 'lint@team', scope: 'project', enabled: true, projectPath: '/p' },
      ],
    }

    expect(installedFor(reply, ['/p']).map((plugin) => [plugin.name, plugin.marketplace])).toEqual([
      ['context7', 'official'],
      ['lint', 'team'],
    ])
  })

  it('каталог - самые устанавливаемые первыми; маркетплейс - откуда он', () => {
    const available = availablePlugins({
      available: [
        { pluginId: 'a@m', name: 'a', installCount: 3 },
        { pluginId: 'b@m', name: 'b', installCount: 90, description: 'x'.repeat(500) },
      ],
    })

    expect(available.map((plugin) => plugin.id)).toEqual(['b@m', 'a@m'])
    expect(available[0]?.description.length).toBeLessThan(500)
    expect(
      marketplacesOf([{ name: 'claude-community', source: 'github', repo: 'anthropics/x' }]),
    ).toEqual([{ name: 'claude-community', source: 'github: anthropics/x' }])
  })

  it('проект через симлинк: CLI пишет настоящий путь - плагины проекта видны', () => {
    const reply = { installed: [{ id: 'lint@team', scope: 'local', projectPath: '/real/p' }] }

    expect(installedFor(reply, ['/link/p', '/real/p'])).toHaveLength(1)
  })

  it('адрес частного маркетплейса - без логина и токена', () => {
    expect(
      marketplacesOf([
        {
          name: 'private',
          source: 'git',
          url: 'https://me:ghp_abcdefghijklmnop1234@git.io/team/m.git',
        },
      ]),
    ).toEqual([{ name: 'private', source: 'git: https://git.io/team/m.git' }])
  })
})
