import { it, expect, describe } from 'vitest'

import type { ConfigFiles } from './claude-config'
import {
  checkpointsOn,
  configCommand,
  isChangeTaken,
  configSettings,
  parseConfigHelp,
} from './claude-config'

/** Начало настоящего ответа `/config` в `claude -p` (2.1.293). */
const HELP = `Usage: /config key=value [key=value ...]
  agentPushNotifEnabled=true|false
  autoCompact=true|false
  language=<value>
  model=default|sonnet|opus|haiku|fable|best|sonnet[1m]|opus[1m]|fable[1m]|opusplan
  switchModelsOnFlag=Switch automatically|Ask each time
  tips=true|false
  verbose=true|false
  workflows=true|false
  brandNewThing=a|b`

const entries = parseConfigHelp(HELP)

const files = (overrides: Partial<ConfigFiles> = {}): ConfigFiles => ({
  layers: [],
  globalConfig: {},
  ...overrides,
})

const settingOf = (key: string, from: ConfigFiles) =>
  configSettings(entries, from).find((setting) => setting.key === key)

describe('справка /config', () => {
  it('строки «ключ=варианты»: шапка пропускается, варианты с пробелами целы', () => {
    expect(entries.map((entry) => entry.key)).toContain('autoCompact')
    expect(entries.find((entry) => entry.key === 'switchModelsOnFlag')?.options).toEqual([
      'Switch automatically',
      'Ask each time',
    ])
    expect(entries.find((entry) => entry.key === 'language')).toEqual({
      key: 'language',
      options: [],
      free: true,
    })
  })

  it('чужой ответ - пустой список, а не мусор', () => {
    expect(parseConfigHelp('Unknown command: /config')).toEqual([])
  })
})

describe('действующие значения', () => {
  it('порядок по важности, незнакомые - в конце, в группе «прочее» и без значения', () => {
    const settings = configSettings(entries, files())

    expect(settings[0]?.key).toBe('autoCompact')
    expect(settings.at(-1)).toMatchObject({ key: 'brandNewThing', group: 'other', value: null })
  })

  it('глобальная: settings.json человека, потом старый .claude.json, потом умолчание', () => {
    const user = { layer: 'user' as const, settings: { verbose: true } }

    expect(settingOf('verbose', files({ layers: [user] }))?.value).toBe('true')
    expect(settingOf('verbose', files({ globalConfig: { verbose: false } }))?.value).toBe('false')
    expect(settingOf('verbose', files())?.value).toBe('false')
  })

  it('глобальную файлы проекта не задают', () => {
    const project = { layer: 'project' as const, settings: { autoCompactEnabled: false } }

    expect(settingOf('autoCompact', files({ layers: [project] }))?.value).toBe('true')
  })

  it('умолчание, которое CLI считает на ходу, не угадывается', () => {
    expect(settingOf('workflows', files())?.value).toBeNull()
  })

  it('выключатель рядом гасит настройку, что бы она ни говорила', () => {
    const user = { layer: 'user' as const, settings: { enableWorkflows: true } }
    const policy = { layer: 'policy' as const, settings: { disableWorkflows: true } }

    expect(settingOf('workflows', files({ layers: [policy, user] }))).toMatchObject({
      value: 'false',
      lockedBy: 'policy',
    })
  })

  it('слой сильнее того, куда пишет /config, - блокировка с названием слоя', () => {
    const project = { layer: 'project' as const, settings: { model: 'opus' } }

    expect(settingOf('model', files({ layers: [project] }))).toMatchObject({
      value: 'opus',
      lockedBy: 'project',
    })
  })

  it('настройка локального файла проекта - только здесь, и проект её не блокирует', () => {
    const local = { layer: 'local' as const, settings: { spinnerTipsEnabled: false } }

    expect(settingOf('tips', files({ layers: [local] }))).toMatchObject({
      value: 'false',
      lockedBy: null,
      projectOnly: true,
    })
  })

  it('булево из файла - словами варианта', () => {
    const user = { layer: 'user' as const, settings: { switchModelsOnFlag: false } }

    expect(settingOf('switchModelsOnFlag', files({ layers: [user] }))?.value).toBe('Ask each time')
  })
})

describe('правка', () => {
  it('только ключ из справки и только его вариант', () => {
    expect(configCommand(entries, 'verbose', 'true')).toBe('/config verbose=true')
    expect(configCommand(entries, 'verbose', 'maybe')).toBeNull()
    expect(configCommand(entries, 'nope', 'true')).toBeNull()
  })

  it('свободное значение - одной строкой, пустое - не правка', () => {
    expect(configCommand(entries, 'language', ' русский\nязык ')).toBe(
      '/config language=русский язык',
    )
    expect(configCommand(entries, 'language', '  ')).toBeNull()
  })

  it('исход - по файлу: как просили - принято; свободное - если поменялось', () => {
    expect(isChangeTaken({ asked: 'true', before: 'false', after: 'true', free: false })).toBe(true)
    expect(isChangeTaken({ asked: 'true', before: 'false', after: 'false', free: false })).toBe(
      false,
    )
    expect(isChangeTaken({ asked: 'ja', before: 'default', after: 'Japanese', free: true })).toBe(
      true,
    )
    expect(isChangeTaken({ asked: 'x', before: null, after: null, free: false })).toBe(true)
  })
})

describe('копии файлов для отката кода', () => {
  it('по умолчанию включены: CLI держит их без записи в конфиге', () => {
    expect(checkpointsOn(files())).toBe(true)
  })

  it('выключены человеком - в settings.json или в старом .claude.json', () => {
    const user = { layer: 'user' as const, settings: { fileCheckpointingEnabled: false } }

    expect(checkpointsOn(files({ layers: [user] }))).toBe(false)
    expect(checkpointsOn(files({ globalConfig: { fileCheckpointingEnabled: false } }))).toBe(false)
  })

  it('файл репозитория глобальную настройку не выключает', () => {
    const project = { layer: 'project' as const, settings: { fileCheckpointingEnabled: false } }

    expect(checkpointsOn(files({ layers: [project] }))).toBe(true)
  })
})
