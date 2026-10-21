import { it, expect, describe } from 'vitest'

import { groupChanges } from './ChangesView.utils'

describe('groupChanges', () => {
  it('известные git - первой группой, новые файлы - второй, пустых групп нет', () => {
    const files = [
      { path: 'a.ts', kind: 'modified', origin: null },
      { path: 'new.ts', kind: 'untracked', origin: null },
      { path: 'b.ts', kind: 'renamed', origin: 'old.ts' },
    ] as const

    expect(groupChanges(files)).toEqual([
      { id: 'tracked', files: [files[0], files[2]] },
      { id: 'untracked', files: [files[1]] },
    ])
    expect(groupChanges([files[1]]).map((group) => group.id)).toEqual(['untracked'])
  })
})
