import { it, expect, describe } from 'vitest'

import { splitParagraphs } from './UserMessage.utils'

describe('splitParagraphs', () => {
  it('режет по пустой строке, одиночный перенос оставляет в абзаце', () => {
    expect(splitParagraphs('one\ntwo\n\nthree')).toEqual(['one\ntwo', 'three'])
  })

  it('несколько пустых строк подряд и строки из пробелов - одна граница', () => {
    expect(splitParagraphs('one\n\n\n  \t\ntwo')).toEqual(['one', 'two'])
  })

  it('пустая строка на краю куска даёт пустой абзац - зазор встаёт у соседнего чипа', () => {
    expect(splitParagraphs('\n\nafter chip')).toEqual(['', 'after chip'])
    expect(splitParagraphs('before chip\n\n')).toEqual(['before chip', ''])
  })

  it('текст без пустых строк - один абзац', () => {
    expect(splitParagraphs('just one line')).toEqual(['just one line'])
  })
})
