import { it, expect, describe } from 'vitest'

import { PREVIEW_WINDOW_CHARS, TEXT_MATCHES_PER_FILE_LIMIT } from './search.constants'
import { locateMatch, buildPreview, findMatchingLines } from './text-match'
import type { MatchPreview } from './text-match'

const highlighted = ({ preview, matchStart, matchLength }: MatchPreview) =>
  preview.slice(matchStart, matchStart + matchLength)

// Половинка суррогатной пары без второй - то, что получается, если резать эмодзи.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/

describe('locateMatch', () => {
  it('без учёта регистра, латиница и кириллица', () => {
    expect(locateMatch('const UserName = 1', 'username')).toEqual({ start: 6, length: 8 })
    expect(locateMatch('// Привет, мир', 'ПРИВЕТ')).toEqual({ start: 3, length: 6 })
    expect(locateMatch('nothing here', 'zzz')).toBeNull()
  })

  it('индексы в символах JS: эмодзи - это две единицы', () => {
    expect(locateMatch('a😀Foo', 'foo')).toEqual({ start: 3, length: 3 })
  })

  it('буква, которая при свёртке удлиняется (İ), не сдвигает позицию', () => {
    expect(locateMatch('İstanbul foo', 'FOO')).toEqual({ start: 9, length: 3 })
  })
})

describe('buildPreview', () => {
  it('отступ и хвостовые пробелы срезаны, позиция - в срезанной строке', () => {
    expect(buildPreview('\t\t  return Foo(x)  \r', 'foo')).toEqual({
      preview: 'return Foo(x)',
      matchStart: 7,
      matchLength: 3,
    })
  })

  it('отступ не срезается внутри совпадения', () => {
    expect(buildPreview('    foo', '  foo')).toEqual({
      preview: '  foo',
      matchStart: 0,
      matchLength: 5,
    })
  })

  it('длинная строка - окно вокруг совпадения с «…» с обеих сторон', () => {
    const result = buildPreview(`${'a'.repeat(1000)}NEEDLE${'b'.repeat(1000)}`, 'needle')

    expect(result.preview.startsWith('…')).toBe(true)
    expect(result.preview.endsWith('…')).toBe(true)
    expect(result.preview.length).toBe(PREVIEW_WINDOW_CHARS + 2)
    expect(highlighted(result)).toBe('NEEDLE')
  })

  it('совпадение в начале или в конце длинной строки - «…» только с другой стороны', () => {
    const atStart = buildPreview(`NEEDLE${'b'.repeat(1000)}`, 'needle')
    const atEnd = buildPreview(`${'a'.repeat(1000)}NEEDLE`, 'needle')

    expect(atStart.preview.startsWith('…')).toBe(false)
    expect(atStart.preview.endsWith('…')).toBe(true)
    expect(atStart.matchStart).toBe(0)
    expect(atEnd.preview.startsWith('…')).toBe(true)
    expect(atEnd.preview.endsWith('NEEDLE')).toBe(true)
    expect(highlighted(atEnd)).toBe('NEEDLE')
  })

  it('край окна не разрезает эмодзи', () => {
    for (let shift = 0; shift < 4; shift += 1) {
      const text = `${'x'.repeat(shift)}${'😀'.repeat(300)}needle${'😀'.repeat(300)}`
      const result = buildPreview(text, 'NEEDLE')

      expect(result.preview).not.toMatch(LONE_SURROGATE)
      expect(highlighted(result)).toBe('needle')
    }
  })

  it('совпадение длиннее окна - видно его начало', () => {
    const query = 'q'.repeat(200)
    const result = buildPreview(`${'x'.repeat(50)}${query}${'y'.repeat(50)}`, query)

    expect(result.matchStart).toBe(1)
    expect(result.matchLength).toBe(PREVIEW_WINDOW_CHARS)
    expect(highlighted(result)).toBe('q'.repeat(PREVIEW_WINDOW_CHARS))
  })

  it('обрезанная при разборе строка: «…» справа, даже если окно дошло до конца', () => {
    expect(buildPreview('short foo', 'foo', true)).toEqual({
      preview: 'short foo…',
      matchStart: 6,
      matchLength: 3,
    })

    const atKeptEnd = buildPreview(`${'a'.repeat(1000)}foo`, 'foo', true)

    expect(atKeptEnd.preview.endsWith('foo…')).toBe(true)
    expect(highlighted(atKeptEnd)).toBe('foo')
  })

  it('совпадение не нашлось - строка без подсветки', () => {
    expect(buildPreview('  something', 'zzz')).toEqual({
      preview: '  something',
      matchStart: 0,
      matchLength: 0,
    })
  })
})

describe('findMatchingLines', () => {
  it('номера строк с 1, перевод строки Windows срезан', () => {
    expect(findMatchingLines('one\r\nTwo needle\r\nthree\r\nNEEDLE', 'needle')).toEqual([
      { line: 2, text: 'Two needle' },
      { line: 4, text: 'NEEDLE' },
    ])
  })

  it('не больше предела на файл', () => {
    const content = Array.from({ length: 30 }, (_value, index) => `hit ${index}`).join('\n')

    expect(findMatchingLines(content, 'HIT')).toHaveLength(TEXT_MATCHES_PER_FILE_LIMIT)
  })

  it('нет совпадений - пусто', () => {
    expect(findMatchingLines('abc\ndef', 'xyz')).toEqual([])
  })
})
