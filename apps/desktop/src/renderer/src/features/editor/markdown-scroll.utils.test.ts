// @vitest-environment happy-dom
import { it, expect, describe } from 'vitest'

import { anchorTop, lineOfTop, topOfLine, orderedMarks } from './markdown-scroll.utils'

const marks = orderedMarks([
  { line: 5, top: 100 },
  { line: 15, top: 300 },
  { line: 16, top: 250 },
  { line: 21, top: 400 },
])

describe('прокрутка кода и просмотра вместе', () => {
  it('метки по порядку, без тех, что выше предыдущей; первая - начало файла', () => {
    expect(marks).toEqual([
      { line: 1, top: 0 },
      { line: 5, top: 100 },
      { line: 15, top: 300 },
      { line: 21, top: 400 },
    ])
  })

  it('между метками - по доле, за последней - на ней', () => {
    expect(topOfLine(marks, 1)).toBe(0)
    expect(topOfLine(marks, 3)).toBe(50)
    expect(topOfLine(marks, 10)).toBe(200)
    expect(topOfLine(marks, 30)).toBe(400)
  })

  it('обратное: строка для высоты листа', () => {
    expect(lineOfTop(marks, 200)).toBe(10)
    expect(lineOfTop(marks, -5)).toBe(1)
    expect(lineOfTop(marks, 1000)).toBe(21)

    for (const line of [1, 2.5, 7, 14.2, 20])
      expect(lineOfTop(marks, topOfLine(marks, line))).toBeCloseTo(line)
  })
})

describe('anchorTop', () => {
  const sheet = () => {
    const scroll = document.createElement('div')

    scroll.innerHTML = '<article><h2 id="md-usage">Usage</h2></article>'

    return scroll
  }

  it('якорь заголовка находится, неизвестный - нет', () => {
    expect(anchorTop(sheet(), 'usage')).toEqual(expect.any(Number))
    expect(anchorTop(sheet(), 'Usage')).toEqual(expect.any(Number))
    expect(anchorTop(sheet(), 'nope')).toBeNull()
  })

  it('пустой якорь и «top» - начало листа', () => {
    expect(anchorTop(sheet(), '')).toBe(0)
    expect(anchorTop(sheet(), 'Top')).toBe(0)
  })
})
