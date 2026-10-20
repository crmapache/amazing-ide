import { it, expect, describe } from 'vitest'

import { isInsideAny, ancestorPaths, symlinkedFolders } from './file-tree.utils'

describe('ancestorPaths', () => {
  it('все папки над файлом, от корня вглубь', () => {
    expect(ancestorPaths('src/features/tree/Node.tsx')).toEqual([
      'src',
      'src/features',
      'src/features/tree',
    ])
  })

  it('у файла в корне папок нет', () => {
    expect(ancestorPaths('package.json')).toEqual([])
  })
})

describe('isInsideAny', () => {
  it('сам путь и всё под ним, но не соседи с тем же началом имени', () => {
    expect(isInsideAny('src', ['src'])).toBe(true)
    expect(isInsideAny('src/app/deep', ['docs', 'src'])).toBe(true)
    expect(isInsideAny('srcx/app', ['src'])).toBe(false)
    expect(isInsideAny('src', [])).toBe(false)
  })
})

describe('symlinkedFolders', () => {
  it('только папки-ссылки, из всех прочитанных списков', () => {
    const entry = (relativePath: string, kind: 'file' | 'directory', isSymlink: boolean) => ({
      name: relativePath.split('/').at(-1) ?? '',
      relativePath,
      kind,
      isSymlink,
    })

    expect(
      symlinkedFolders([
        [entry('node_modules/ui', 'directory', true), entry('node_modules/a', 'directory', false)],
        undefined,
        [entry('link.txt', 'file', true)],
      ]),
    ).toEqual(['node_modules/ui'])
  })
})
