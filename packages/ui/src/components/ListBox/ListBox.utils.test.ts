import { it, expect, describe } from 'vitest'

import { nextActiveIndex } from './ListBox.utils'

describe('nextActiveIndex', () => {
  it('вниз и вверх ходят по кругу', () => {
    expect(nextActiveIndex('ArrowDown', 0, 3)).toBe(1)
    expect(nextActiveIndex('ArrowDown', 2, 3)).toBe(0)
    expect(nextActiveIndex('ArrowUp', 1, 3)).toBe(0)
    expect(nextActiveIndex('ArrowUp', 0, 3)).toBe(2)
  })

  it('без выделения вниз - на первый, вверх - на последний', () => {
    expect(nextActiveIndex('ArrowDown', -1, 3)).toBe(0)
    expect(nextActiveIndex('ArrowUp', -1, 3)).toBe(2)
  })

  it('пустой список и не стрелки - не трогает', () => {
    expect(nextActiveIndex('ArrowDown', -1, 0)).toBeNull()
    expect(nextActiveIndex('Home', 1, 3)).toBeNull()
    expect(nextActiveIndex('a', 1, 3)).toBeNull()
  })
})
