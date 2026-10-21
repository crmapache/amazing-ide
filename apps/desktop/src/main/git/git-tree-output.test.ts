import { it, expect, describe } from 'vitest'

import { parseTreeEntries } from './git-tree-output'

describe('parseTreeEntries', () => {
  it('файл с размером, папка и подмодуль без него, путь с пробелами и табом целиком', () => {
    const stdout = [
      '100644 blob aaaa       12\tsrc/my file.ts',
      '040000 tree bbbb       -\tsrc/dir',
      '160000 commit cccc       -\tvendor/lib',
      '100644 blob dddd        3\twith\ttab.txt',
      '',
    ].join('\0')

    expect(parseTreeEntries(stdout)).toEqual([
      { type: 'blob', oid: 'aaaa', size: 12, path: 'src/my file.ts' },
      { type: 'tree', oid: 'bbbb', size: null, path: 'src/dir' },
      { type: 'commit', oid: 'cccc', size: null, path: 'vendor/lib' },
      { type: 'blob', oid: 'dddd', size: 3, path: 'with\ttab.txt' },
    ])
  })

  it('пустой ответ - записей нет', () => {
    expect(parseTreeEntries('')).toEqual([])
  })
})
