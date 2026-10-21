import { it, expect, describe } from 'vitest'

import { eolOf, withEol, isTouched, changedSpan } from './documents.utils'

const apply = (before: string, after: string) => {
  const { start, oldEnd, newEnd } = changedSpan(before, after)

  return before.slice(0, start) + after.slice(start, newEnd) + before.slice(oldEnd)
}

describe('changedSpan', () => {
  it('трогает только середину', () => {
    expect(changedSpan('const a = 1\nconst b = 2\n', 'const a = 1\nconst b = 3\n')).toEqual({
      start: 22,
      oldEnd: 23,
      newEnd: 23,
    })
    expect(changedSpan('same', 'same')).toEqual({ start: 4, oldEnd: 4, newEnd: 4 })
  })

  it('вставка, удаление и повтор символов собираются обратно в новый текст', () => {
    const cases: [string, string][] = [
      ['abc', 'abXc'],
      ['aaaa', 'aa'],
      ['', 'new file'],
      ['old', ''],
      ['x\r\ny\r\n', 'x\r\nz\r\ny\r\n'],
      ['😀a', '😁a'],
    ]

    for (const [before, after] of cases) expect(apply(before, after)).toBe(after)
  })

  it('не режет \\r\\n и суррогатную пару', () => {
    const crlf = changedSpan('a\r\nb', 'a\nb')
    const emoji = changedSpan('😀', '😁')

    expect('a\r\nb'[crlf.start - 1]).not.toBe('\r')
    expect(emoji.start).toBe(0)
  })
})

describe('isTouched', () => {
  it('сам файл, папка над ним или всё сразу', () => {
    expect(isTouched('src/app.ts', ['src/app.ts'])).toBe(true)
    expect(isTouched('src/app.ts', ['src'])).toBe(true)
    expect(isTouched('src/app.ts', ['src/app.tsx', 'sr'])).toBe(false)
    expect(isTouched('src/app.ts', null)).toBe(true)
  })
})

describe('переводы строк', () => {
  it('CRLF, LF или одна строка', () => {
    expect(eolOf('a\r\nb')).toBe('\r\n')
    expect(eolOf('a\nb')).toBe('\n')
    expect(eolOf('a')).toBeNull()
  })

  it('текст приводится к переводу модели, смешанный - тоже', () => {
    expect(withEol('a\r\nb\nc', '\n')).toBe('a\nb\nc')
    expect(withEol('a\nb', '\r\n')).toBe('a\r\nb')
  })
})
