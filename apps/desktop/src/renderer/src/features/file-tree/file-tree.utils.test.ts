import { it, expect, describe } from 'vitest'

import { ancestorPaths } from './file-tree.utils'

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
