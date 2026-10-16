import { it, expect, describe } from 'vitest'

import { nextIndex } from './Menu.utils'

describe('nextIndex', () => {
  it('из поля поиска вниз - на первый пункт', () => {
    expect(nextIndex('ArrowDown', -1, 3)).toBe(0)
  })

  it('по пунктам вниз и вверх, без выхода за края', () => {
    expect(nextIndex('ArrowDown', 0, 3)).toBe(1)
    expect(nextIndex('ArrowDown', 2, 3)).toBe(2)
    expect(nextIndex('ArrowUp', 2, 3)).toBe(1)
  })

  it('вверх с первого пункта - никуда: фокус можно вернуть в поиск руками', () => {
    expect(nextIndex('ArrowUp', 0, 3)).toBeNull()
  })

  it('Home и End, пустое меню', () => {
    expect(nextIndex('Home', 2, 3)).toBe(0)
    expect(nextIndex('End', 0, 3)).toBe(2)
    expect(nextIndex('ArrowDown', -1, 0)).toBeNull()
  })
})
