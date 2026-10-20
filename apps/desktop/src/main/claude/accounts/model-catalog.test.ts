import { it, expect, describe } from 'vitest'

import { clampModel, canRunModel, catalogHolds, catalogNames } from './model-catalog'

const PRO = catalogNames([
  { value: 'default', displayName: '', description: '', resolved: 'claude-sonnet-5-5' },
  { value: 'sonnet', displayName: '', description: '', resolved: 'claude-sonnet-5-5' },
  { value: 'haiku', displayName: '', description: '', resolved: 'claude-haiku-5-5' },
])
const MAX = catalogNames([
  { value: 'default', displayName: '', description: '', resolved: 'claude-opus-5-5' },
  { value: 'opus', displayName: '', description: '', resolved: 'claude-opus-5-5' },
  { value: 'opus[1m]', displayName: '', description: '' },
  { value: 'sonnet', displayName: '', description: '' },
])

describe('каталог аккаунта держит модель', () => {
  it('под любым её именем: opus каталога и claude-opus-5 транскрипта - одна модель', () => {
    expect(catalogHolds(MAX, 'claude-opus-5-5')).toBe(true)
    expect(catalogHolds(MAX, 'opus')).toBe(true)
    expect(catalogHolds(PRO, 'claude-opus-5-5')).toBe(false)
  })

  it('метка окна - только у записи с той же меткой, без метки держит и запись с меткой', () => {
    expect(catalogHolds(MAX, 'opus[1m]')).toBe(true)
    expect(catalogHolds(PRO, 'sonnet[1m]')).toBe(false)
    expect(catalogHolds(['opus[1m]'], 'opus')).toBe(true)
  })

  it('без каталога - не знаем; своя модель из Settings - можно всегда', () => {
    expect(canRunModel(null, 'opus', [])).toBeNull()
    expect(canRunModel(PRO, 'gateway/opus-x', ['gateway/opus-x'])).toBe(true)
    expect(canRunModel(PRO, '', [])).toBe(true)
  })
})

describe('модель прижимается к аккаунту до подъёма процесса', () => {
  const on = (names: readonly string[] | null) => (model: string) => canRunModel(names, model, [])

  it('можно или неизвестно - остаётся как есть', () => {
    expect(clampModel('opus', on(MAX), [])).toBe('opus')
    expect(clampModel('opus', on(null), ['sonnet'])).toBe('opus')
    expect(clampModel(null, on(PRO), ['sonnet'])).toBeNull()
  })

  it('метка окна, которой нет, снимается раньше смены модели', () => {
    expect(clampModel('sonnet[1m]', on(PRO), ['haiku'])).toBe('sonnet')
  })

  it('иначе запасная, которую аккаунт может, иначе его умолчание - названное', () => {
    expect(clampModel('opus', on(PRO), ['fable', 'haiku'])).toBe('haiku')
    expect(clampModel('opus', on(PRO), [null, 'fable'])).toBe('default')
  })

  it('каталог без умолчания - флага нет вовсе', () => {
    expect(clampModel('opus', on(['sonnet']), [])).toBeNull()
  })
})
