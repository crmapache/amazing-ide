import { it, expect, describe } from 'vitest'

import { resolveInsideRoot } from './project-paths'

describe('resolveInsideRoot', () => {
  const root = '/Users/max/project'

  it('корень и вложенные пути - внутри', () => {
    expect(resolveInsideRoot(root, '')).toBe(root)
    expect(resolveInsideRoot(root, 'src/main')).toBe('/Users/max/project/src/main')
  })

  it('выход наверх и абсолютные пути - снаружи', () => {
    expect(resolveInsideRoot(root, '..')).toBeNull()
    expect(resolveInsideRoot(root, '../other')).toBeNull()
    expect(resolveInsideRoot(root, 'src/../../other')).toBeNull()
    expect(resolveInsideRoot(root, '/etc')).toBeNull()
  })

  it('папка, чьё имя начинается с двух точек, - внутри', () => {
    expect(resolveInsideRoot(root, '..cache')).toBe('/Users/max/project/..cache')
  })

  it('соседняя папка с тем же префиксом - снаружи', () => {
    expect(resolveInsideRoot(root, '../project-copy')).toBeNull()
  })
})
