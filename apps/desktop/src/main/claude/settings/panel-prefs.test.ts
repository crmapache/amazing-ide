import { it, expect, describe } from 'vitest'

import { DEFAULT_PANEL_PREFS } from '@shared/claude-prefs'

import { applyPrefsPatch, parsePanelPrefs, changedSourceProjects } from './panel-prefs'

describe('настройки панели', () => {
  it('битое и чужое с диска - по умолчанию, поле за полем', () => {
    expect(parsePanelPrefs(null)).toEqual(DEFAULT_PANEL_PREFS)
    expect(parsePanelPrefs({ sendKey: 'space', spellcheck: false })).toEqual({
      ...DEFAULT_PANEL_PREFS,
      spellcheck: false,
    })
  })

  it('числа прижимаются к пределам', () => {
    const prefs = parsePanelPrefs({ textSize: 99, gaugeVivid: -5, pasteCollapse: 3.4 })

    expect(prefs.textSize).toBe(32)
    expect(prefs.gaugeVivid).toBe(0)
    expect(prefs.pasteCollapse).toBe(3)
    expect(parsePanelPrefs({ textSize: 0 }).textSize).toBe(0)
  })

  it('своя модель - только имя, годное для аргумента запуска', () => {
    const prefs = parsePanelPrefs({
      customModels: ['gpt-proxy/opus', 'bad name', 'a"b', 'gpt-proxy/opus'],
    })

    expect(prefs.customModels).toEqual(['gpt-proxy/opus'])
  })

  it('источники настроек: по абсолютной папке, all не хранится', () => {
    const prefs = parsePanelPrefs({
      settingSources: { '/p/a': 'user', '/p/b': 'all', relative: 'user', '/p/c': 'nope' },
    })

    expect(prefs.settingSources).toEqual({ '/p/a': 'user' })
  })

  it('путь к CLI - пусто или абсолютный путь одной строкой', () => {
    expect(parsePanelPrefs({ cliPath: ' /opt/claude/bin/claude ' }).cliPath).toBe(
      '/opt/claude/bin/claude',
    )
    expect(parsePanelPrefs({ cliPath: 'claude' }).cliPath).toBe('')
    expect(parsePanelPrefs({ cliPath: '/a\n/b' }).cliPath).toBe('')
    expect(applyPrefsPatch(DEFAULT_PANEL_PREFS, { cliPath: '' }).cliPath).toBe('')
  })

  it('патч меняет только названное', () => {
    const next = applyPrefsPatch(DEFAULT_PANEL_PREFS, { sendKey: 'modEnter', newTabModel: null })

    expect(next).toEqual({ ...DEFAULT_PANEL_PREFS, sendKey: 'modEnter' })
  })

  it('негодное поле в патче - отказ, а не тихий пропуск', () => {
    expect(() => applyPrefsPatch(DEFAULT_PANEL_PREFS, { sendKey: 'space' })).toThrow()
    expect(() => applyPrefsPatch(DEFAULT_PANEL_PREFS, { unknown: true })).toThrow()
  })

  it('имя модели с дефиса - не модель: CLI прочёл бы его флагом', () => {
    expect(parsePanelPrefs({ customModels: ['--help', 'proxy/opus'] }).customModels).toEqual([
      'proxy/opus',
    ])
  })

  it('удалённая своя модель снимается и с новых вкладок', () => {
    const prefs = { ...DEFAULT_PANEL_PREFS, customModels: ['a', 'b'], newTabModel: 'a' }

    expect(applyPrefsPatch(prefs, { customModels: ['b'] }).newTabModel).toBeNull()
    expect(
      applyPrefsPatch({ ...prefs, newTabModel: 'opus' }, { customModels: [] }).newTabModel,
    ).toBe('opus')
  })

  it('сменившиеся источники - по папке, «все» и отсутствие записи - одно и то же', () => {
    expect(changedSourceProjects({ '/a': 'user', '/b': 'noLocal' }, { '/b': 'user' })).toEqual([
      '/a',
      '/b',
    ])
    expect(changedSourceProjects({ '/a': 'user' }, { '/a': 'user' })).toEqual([])
  })
})
