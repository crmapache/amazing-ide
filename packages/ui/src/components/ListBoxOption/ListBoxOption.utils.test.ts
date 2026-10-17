import { it, expect, describe } from 'vitest'

import { splitByRanges } from './ListBoxOption.utils'

describe('splitByRanges', () => {
  it('режет на обычные и подсвеченные куски', () => {
    expect(splitByRanges('FileTree.tsx', [{ start: 4, length: 4 }])).toEqual([
      { text: 'File', isMatch: false },
      { text: 'Tree', isMatch: true },
      { text: '.tsx', isMatch: false },
    ])
  })

  it('склеивает соседние и пересекающиеся места в любом порядке', () => {
    expect(
      splitByRanges('abcdef', [
        { start: 3, length: 2 },
        { start: 0, length: 1 },
        { start: 1, length: 1 },
        { start: 4, length: 1 },
      ]),
    ).toEqual([
      { text: 'ab', isMatch: true },
      { text: 'c', isMatch: false },
      { text: 'de', isMatch: true },
      { text: 'f', isMatch: false },
    ])
  })

  it('места за пределами текста обрезает, пустой текст - пустой список', () => {
    expect(splitByRanges('abc', [{ start: 2, length: 10 }])).toEqual([
      { text: 'ab', isMatch: false },
      { text: 'c', isMatch: true },
    ])
    expect(splitByRanges('', [{ start: 0, length: 3 }])).toEqual([])
  })
})
