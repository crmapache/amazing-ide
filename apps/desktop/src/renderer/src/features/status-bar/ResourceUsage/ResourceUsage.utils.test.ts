import { it, expect, describe } from 'vitest'

import { formatMemory } from './ResourceUsage.utils'

const MB = 1024 * 1024

describe('formatMemory', () => {
  it('до гигабайта - целые мегабайты', () => {
    expect(formatMemory(0)).toEqual({ unit: 'mb', value: '0' })
    expect(formatMemory(124.4 * MB)).toEqual({ unit: 'mb', value: '124' })
    expect(formatMemory(1023.4 * MB)).toEqual({ unit: 'mb', value: '1023' })
  })

  it('то, что округлилось до 1024 MB, - уже гигабайт', () => {
    expect(formatMemory(1023.6 * MB)).toEqual({ unit: 'gb', value: '1.0' })
  })

  it('от гигабайта - гигабайты с одним знаком', () => {
    expect(formatMemory(1024 * MB)).toEqual({ unit: 'gb', value: '1.0' })
    expect(formatMemory(1.26 * 1024 * MB)).toEqual({ unit: 'gb', value: '1.3' })
    expect(formatMemory(12 * 1024 * MB)).toEqual({ unit: 'gb', value: '12.0' })
  })
})
