import { it, expect, describe } from 'vitest'

import { TEXT_SIZE } from './text-size.constants'
import { fontScaleOf, clampTextSize, restoreTextSize, steppedTextSize } from './text-size.utils'

describe('clampTextSize', () => {
  it('значение на сетке и в пределах остаётся как есть', () => {
    expect(clampTextSize(115)).toBe(115)
  })

  it('между ступенями - к ближайшей', () => {
    expect(clampTextSize(112)).toBe(110)
    expect(clampTextSize(113)).toBe(115)
  })

  it('за пределами - край', () => {
    expect(clampTextSize(10)).toBe(TEXT_SIZE.min)
    expect(clampTextSize(400)).toBe(TEXT_SIZE.max)
  })

  it('не число - размер по умолчанию, а не ноль', () => {
    expect(clampTextSize('120')).toBe(TEXT_SIZE.default)
    expect(clampTextSize(Number.NaN)).toBe(TEXT_SIZE.default)
    expect(clampTextSize(undefined)).toBe(TEXT_SIZE.default)
  })
})

describe('steppedTextSize', () => {
  it('шаг вверх и вниз - соседняя ступень', () => {
    expect(steppedTextSize(100, 1)).toBe(105)
    expect(steppedTextSize(100, -1)).toBe(95)
  })

  it('у края остаётся на краю', () => {
    expect(steppedTextSize(TEXT_SIZE.max, 1)).toBe(TEXT_SIZE.max)
    expect(steppedTextSize(TEXT_SIZE.min, -1)).toBe(TEXT_SIZE.min)
  })
})

describe('restoreTextSize', () => {
  it('берёт размер из записи', () => {
    expect(restoreTextSize({ textSize: 130 })).toBe(130)
  })

  it('пустая и чужая запись - по умолчанию', () => {
    expect(restoreTextSize(undefined)).toBe(TEXT_SIZE.default)
    expect(restoreTextSize(null)).toBe(TEXT_SIZE.default)
    expect(restoreTextSize({ zoom: 2 })).toBe(TEXT_SIZE.default)
  })

  it('испорченное значение прижимается к пределам', () => {
    expect(restoreTextSize({ textSize: 9000 })).toBe(TEXT_SIZE.max)
  })
})

describe('fontScaleOf', () => {
  it('проценты - множителем для токенов', () => {
    expect(fontScaleOf(100)).toBe('1')
    expect(fontScaleOf(115)).toBe('1.15')
  })
})
