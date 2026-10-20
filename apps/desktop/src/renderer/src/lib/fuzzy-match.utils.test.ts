import { it, expect, describe } from 'vitest'

import { fuzzyMatch } from './fuzzy-match.utils'

const score = (query: string, text: string) => fuzzyMatch(query, text)?.score ?? -Infinity

describe('fuzzyMatch', () => {
  it('буквы по порядку, не подряд, без учёта регистра', () => {
    expect(fuzzyMatch('ftv', 'FileTreeView.tsx')?.ranges).toEqual([
      { start: 0, length: 1 },
      { start: 4, length: 1 },
      { start: 8, length: 1 },
    ])
    expect(fuzzyMatch('tvf', 'FileTreeView.tsx')).toBeNull()
    expect(fuzzyMatch('xyz', 'FileTreeView.tsx')).toBeNull()
  })

  it('кусок целиком подсвечивается одним местом, лучше - с начала слова', () => {
    expect(fuzzyMatch('tree', 'FileTreeView.tsx')?.ranges).toEqual([{ start: 4, length: 4 }])
    expect(fuzzyMatch('view', 'preview-view.ts')?.ranges).toEqual([{ start: 8, length: 4 }])
  })

  it('из равных совпадений выше начало слова и начало имени', () => {
    expect(score('tree', 'tree.ts')).toBeGreaterThan(score('tree', 'FileTree.ts'))
    expect(score('tree', 'FileTree.ts')).toBeGreaterThan(score('tree', 'street.ts'))
  })

  it('буквы по началам слов выше той же россыпи посреди слов', () => {
    expect(score('ftv', 'FileTreeView.tsx')).toBeGreaterThan(score('ftv', 'softvoice.ts'))
  })

  it('точное совпадение выше всего, короткое имя выше длинного', () => {
    expect(score('readme.md', 'README.md')).toBeGreaterThan(score('readme', 'README.md'))
    expect(score('store', 'store.ts')).toBeGreaterThan(score('store', 'store.module.ts'))
  })

  it('пустой запрос подходит ко всему без подсветки', () => {
    expect(fuzzyMatch('', 'anything')).toEqual({ score: 0, ranges: [] })
  })

  it('буква уходит на начало слова, если после неё остаток ещё совпадает', () => {
    // «ps» - p из Project, s из Switcher, а не из «Project» дальше по слову.
    expect(fuzzyMatch('ps', 'ProjectSwitcher.tsx')?.ranges).toEqual([
      { start: 0, length: 1 },
      { start: 7, length: 1 },
    ])
  })
})
