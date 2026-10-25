import { it, expect, describe } from 'vitest'

import { splitPath, displayPath, isOutsidePath } from './path.utils'

describe('splitPath', () => {
  it('папка без слеша на конце и имя файла', () => {
    expect(splitPath('src/app/main.tsx')).toEqual({ folder: 'src/app', name: 'main.tsx' })
  })

  it('файл в корне проекта - без папки', () => {
    expect(splitPath('package.json')).toEqual({ folder: '', name: 'package.json' })
  })
})

describe('isOutsidePath', () => {
  it('абсолютный путь - вне проекта, путь от корня - нет', () => {
    expect(isOutsidePath('/Users/max/.claude/plans/a.md')).toBe(true)
    expect(isOutsidePath('src/app/main.tsx')).toBe(false)
    expect(isOutsidePath('.claude/rules/x.md')).toBe(false)
  })
})

describe('displayPath', () => {
  it('домашняя папка - через ~', () => {
    expect(displayPath('/Users/max/Documents/Projects/x', '/Users/max')).toBe(
      '~/Documents/Projects/x',
    )
  })

  it('похожий префикс и чужие пути - как есть', () => {
    expect(displayPath('/Users/maxim/x', '/Users/max')).toBe('/Users/maxim/x')
    expect(displayPath('/opt/x', undefined)).toBe('/opt/x')
  })
})
