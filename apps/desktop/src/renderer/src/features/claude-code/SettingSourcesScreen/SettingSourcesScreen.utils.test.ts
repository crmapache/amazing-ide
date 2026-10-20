import { it, expect, describe } from 'vitest'

import { withSources } from './SettingSourcesScreen.utils'

describe('источники настроек по проекту', () => {
  it('выбор меняет только свой проект, «все» не хранится', () => {
    const all = { '/a': 'user' as const, '/b': 'noLocal' as const }

    expect(withSources(all, '/b', 'user')).toEqual({ '/a': 'user', '/b': 'user' })
    expect(withSources(all, '/a', 'all')).toEqual({ '/b': 'noLocal' })
  })
})
