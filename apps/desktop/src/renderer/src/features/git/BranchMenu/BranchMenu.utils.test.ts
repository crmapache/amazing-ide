import { it, expect, describe } from 'vitest'

import { matchesQuery, filterByQuery } from './BranchMenu.utils'

describe('matchesQuery', () => {
  it('без регистра, по части имени, пустой запрос - всё', () => {
    expect(matchesQuery('feature/Tabs', 'tabs')).toBe(true)
    expect(matchesQuery('main', '  ')).toBe(true)
    expect(matchesQuery('main', 'dev')).toBe(false)
  })
})

describe('filterByQuery', () => {
  it('оставляет подходящие, порядок сохраняется', () => {
    expect(filterByQuery(['main', 'feature/a', 'feature/b'], 'feat', (item) => item)).toEqual([
      'feature/a',
      'feature/b',
    ])
  })
})
