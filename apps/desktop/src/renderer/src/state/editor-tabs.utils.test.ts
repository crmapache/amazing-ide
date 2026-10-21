import { it, expect, describe } from 'vitest'

import type { EditorTabs } from './editor-tabs.types'
import { NO_TABS, openTab, activeTab, closeTabs, restoreTabs } from './editor-tabs.utils'

const NONE = new Set<string>()

const openAll = (paths: readonly string[], limit = 30, held = NONE): EditorTabs =>
  paths.reduce((tabs, path) => openTab(tabs, path, { limit, held }), NO_TABS)

describe('openTab', () => {
  it('новый файл - в конец и активный; открытый - активный на своём месте', () => {
    const tabs = openAll(['a.ts', 'b.ts', 'c.ts', 'a.ts'])

    expect(tabs.paths).toEqual(['a.ts', 'b.ts', 'c.ts'])
    expect(activeTab(tabs)).toBe('a.ts')
  })

  it('сверх предела закрывается самый первый открытый, а не давно не выбиранный', () => {
    const tabs = openAll(['a.ts', 'b.ts', 'c.ts', 'a.ts', 'd.ts'], 3)

    expect(tabs.paths).toEqual(['b.ts', 'c.ts', 'd.ts'])
    expect(tabs.recent).toEqual(['b.ts', 'c.ts', 'd.ts'])
  })

  it('тридцать первый файл закрывает первый', () => {
    const paths = Array.from({ length: 31 }, (_, index) => `file${index + 1}.ts`)
    const tabs = openAll(paths)

    expect(tabs.paths).toHaveLength(30)
    expect(tabs.paths[0]).toBe('file2.ts')
    expect(activeTab(tabs)).toBe('file31.ts')
  })

  it('удерживаемую вкладку переполнение пропускает', () => {
    const held = new Set(['a.ts'])
    const tabs = openTab(openAll(['a.ts', 'b.ts', 'c.ts']), 'd.ts', { limit: 3, held })

    expect(tabs.paths).toEqual(['a.ts', 'c.ts', 'd.ts'])
  })

  it('удерживаются все - полоса временно длиннее предела', () => {
    const held = new Set(['a.ts', 'b.ts'])
    const tabs = openTab(openAll(['a.ts', 'b.ts']), 'c.ts', { limit: 2, held })

    expect(tabs.paths).toEqual(['a.ts', 'b.ts', 'c.ts'])
  })
})

describe('closeTabs', () => {
  it('закрыл активную - открывается та, что была активна до неё', () => {
    const tabs = openAll(['a.ts', 'b.ts', 'c.ts', 'a.ts'])

    expect(activeTab(closeTabs(tabs, ['a.ts']))).toBe('c.ts')
    expect(activeTab(closeTabs(tabs, ['a.ts', 'c.ts']))).toBe('b.ts')
  })

  it('закрыл не активную - активная та же; последнюю - вкладок нет', () => {
    const tabs = openAll(['a.ts', 'b.ts'])

    expect(activeTab(closeTabs(tabs, ['a.ts']))).toBe('b.ts')
    expect(activeTab(closeTabs(tabs, ['a.ts', 'b.ts']))).toBeUndefined()
  })
})

describe('restoreTabs', () => {
  it('мусор - пустая полоса; recent чинится по открытым', () => {
    expect(restoreTabs(null)).toEqual(NO_TABS)
    expect(
      restoreTabs({ paths: ['a.ts', 'b.ts', 'b.ts', 3], recent: ['b.ts', 'gone.ts'] }),
    ).toEqual({ paths: ['a.ts', 'b.ts'], recent: ['a.ts', 'b.ts'] })
  })
})
