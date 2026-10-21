import { it, vi, expect, describe } from 'vitest'

import { prepareFiles } from '../../lib/file-match.utils'
import type { SearchAction } from './search-everywhere.types'
import {
  rankFiles,
  resultKey,
  openResult,
  isTextQuery,
  rankActions,
  searchStatus,
  buildSections,
  toTextResults,
  sectionOffsets,
  flattenSections,
} from './search-results.utils'

const files = prepareFiles([
  'src/features/file-tree/FileTreeNode/FileTreeNode.tsx',
  'src/features/file-tree/file-tree.store.ts',
  'src/state/selection.store.ts',
  'package.json',
  'docs/tree.md',
])

const action = (id: string, label: string, keywords?: string[]): SearchAction => ({
  id,
  label,
  keywords,
  run: () => undefined,
})

describe('rankFiles', () => {
  it('ищет по имени файла, лучшие сверху, не больше предела', () => {
    const results = rankFiles(files, 'store', 10).map((result) => result.file.path)

    expect(results).toEqual([
      'src/state/selection.store.ts',
      'src/features/file-tree/file-tree.store.ts',
    ])
    expect(rankFiles(files, 'store', 1)).toHaveLength(1)
  })

  it('без «/» папки не смотрит, со «/» - смотрит, а подсвечивает только имя', () => {
    expect(rankFiles(files, 'features', 10)).toEqual([])

    const [result] = rankFiles(files, 'tree/node', 10)

    expect(result?.file.name).toBe('FileTreeNode.tsx')
    expect(result?.match.ranges.every((range) => range.start >= 0)).toBe(true)
    expect(result?.match.ranges.length).toBeGreaterThan(0)
  })

  it('пустой запрос - ничего', () => {
    expect(rankFiles(files, '  ', 10)).toEqual([])
  })

  it('пробел разделяет слова, а не ищется буквально', () => {
    expect(rankFiles(files, 'tree node', 10)[0]?.file.name).toBe('FileTreeNode.tsx')
  })

  it('«й» с клавиатуры (NFC) находит её в разложенном виде (NFD) и наоборот', () => {
    const cyrillic = prepareFiles(['docs/мой.md'.normalize('NFC')])

    expect(rankFiles(cyrillic, 'мой'.normalize('NFD'), 10)).toHaveLength(1)
  })
})

describe('rankActions', () => {
  const actions = [
    action('open', 'Open Project…'),
    action('push', 'Push…', ['git']),
    action('update', 'Update Project…', ['git', 'pull']),
  ]

  it('пустой запрос - все по порядку', () => {
    expect(rankActions(actions, '').map((result) => result.action.id)).toEqual([
      'open',
      'push',
      'update',
    ])
  })

  it('по подписи - с подсветкой, по ключевому слову - ниже и без неё', () => {
    const results = rankActions(actions, 'pu')

    expect(results.map((result) => result.action.id)).toEqual(['push', 'update'])
    expect(results[0]?.match.ranges).toEqual([{ start: 0, length: 2 }])

    const byKeyword = rankActions(actions, 'pull')

    expect(byKeyword.map((result) => result.action.id)).toEqual(['update'])
    expect(byKeyword[0]?.match.ranges).toEqual([])
  })
})

describe('buildSections', () => {
  const fileResults = rankFiles(files, 'e', 50)
  const actionResults = rankActions([action('open', 'Open Project…')], '')
  const text = toTextResults([
    { relativePath: 'a.ts', line: 1, preview: 'x', matchStart: 0, matchLength: 1 },
  ])

  it('«All» - файлы и действия понемногу, без текста', () => {
    const sections = buildSections('all', { files: fileResults, actions: actionResults, text })

    expect(sections.map((section) => section.kind)).toEqual(['file', 'action'])
    expect(sections[0]?.results.length).toBeLessThanOrEqual(6)
  })

  it('вкладка группы - только своя группа целиком, пустые не показываются', () => {
    expect(
      buildSections('files', { files: fileResults, actions: actionResults, text })[0]?.results,
    ).toHaveLength(fileResults.length)
    expect(buildSections('text', { files: [], actions: [], text: [] })).toEqual([])
  })

  it('плоский список идёт по группам подряд, номера групп - по нему', () => {
    const sections = buildSections('all', { files: fileResults, actions: actionResults, text })

    expect(flattenSections(sections).at(-1)?.kind).toBe('action')
    expect(sectionOffsets(sections)).toEqual([0, sections[0]?.results.length])
  })
})

describe('searchStatus', () => {
  const base = {
    tab: 'files',
    needle: 'abc',
    hasProject: true,
    resultCount: 0,
    isPending: false,
  } as const

  it('есть результаты - ready, что бы ни было', () => {
    expect(searchStatus({ ...base, resultCount: 3, hasProject: false })).toBe('ready')
  })

  it('файлы и текст без проекта - noProject, действия ищутся и без него', () => {
    expect(searchStatus({ ...base, hasProject: false })).toBe('noProject')
    expect(searchStatus({ ...base, tab: 'actions', hasProject: false })).toBe('nothingFound')
  })

  it('пустой запрос - подсказка, кроме действий', () => {
    expect(searchStatus({ ...base, needle: '' })).toBe('typeToSearch')
    expect(searchStatus({ ...base, tab: 'actions', needle: '' })).toBe('nothingFound')
  })

  it('текст: короткий и длинный запрос - свои статусы, а не «ничего не нашлось»', () => {
    expect(searchStatus({ ...base, tab: 'text', needle: 'a' })).toBe('shortQuery')
    expect(searchStatus({ ...base, tab: 'text', needle: 'a'.repeat(201) })).toBe('longQuery')
    expect(isTextQuery('a'.repeat(200))).toBe(true)
    expect(isTextQuery('a'.repeat(201))).toBe(false)
  })

  it('ищется - loading, нашлось ноль - nothingFound', () => {
    expect(searchStatus({ ...base, isPending: true })).toBe('loading')
    expect(searchStatus(base)).toBe('nothingFound')
  })
})

describe('resultKey', () => {
  it('у строк разных видов ключи не пересекаются', () => {
    const [file] = rankFiles(files, 'package', 1)
    const [text] = toTextResults([
      { relativePath: 'package.json', line: 3, preview: 'x', matchStart: 0, matchLength: 1 },
    ])

    expect(file && resultKey(file)).toBe('file:package.json')
    expect(text && resultKey(text)).toBe('text:package.json:3')
  })
})

describe('openResult', () => {
  it('файл - открыть; найденная строка - открыть на ней, совпадение - текстом', () => {
    const onOpenFile = vi.fn()
    const [file] = rankFiles(files, 'package', 1)
    const [text] = toTextResults([
      {
        relativePath: 'src/state/selection.store.ts',
        line: 42,
        preview: '…const selectFile = (projectId',
        matchStart: 7,
        matchLength: 10,
      },
    ])

    if (file) openResult(file, onOpenFile)
    if (text) openResult(text, onOpenFile)

    expect(onOpenFile.mock.calls).toEqual([
      [{ path: 'package.json' }],
      [{ path: 'src/state/selection.store.ts', line: 42, find: 'selectFile' }],
    ])
  })
})
