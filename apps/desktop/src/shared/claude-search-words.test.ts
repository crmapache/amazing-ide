import { it, expect, describe } from 'vitest'

import { wordsOf, foldWord, matchSpans } from './claude-search-words'

describe('резка слов поиска - одна на индекс и на ленту', () => {
  it('делит camelCase, цифры и подчёркивание на части и держит целое', () => {
    const terms = wordsOf('oldestEventUuid utf8 HTTPServer snake_case Ёлка café').map(
      (word) => word.term,
    )

    expect(terms).toContain('oldesteventuuid')
    expect(terms).toEqual(expect.arrayContaining(['oldest', 'event', 'uuid']))
    expect(terms).toEqual(expect.arrayContaining(['utf', '8']))
    expect(terms).toEqual(expect.arrayContaining(['http', 'server']))
    expect(terms).toEqual(expect.arrayContaining(['snake', 'case']))
    expect(terms).toContain('елка')
    expect(terms).toContain('cafe')
  })

  it('часть - не целое слово, целое - целое', () => {
    const words = wordsOf('oldestEventUuid')

    expect(words.find((word) => word.term === 'oldesteventuuid')?.whole).toBe(true)
    expect(words.find((word) => word.term === 'event')).toMatchObject({
      start: 6,
      end: 11,
      whole: false,
    })
  })

  it('сворачивает: строчные, без акцентов, ё как е', () => {
    expect(foldWord('Ёлка')).toBe('елка')
    expect(foldWord('Café')).toBe('cafe')
    expect(foldWord('Deepgram')).toBe('deepgram')
  })

  it('буквы с отдельными знаками - одно слово, а не куски', () => {
    expect(wordsOf('café au lait').map((word) => word.term)).toEqual(['cafe', 'au', 'lait'])
  })

  it('красит найденное там, где оно стоит, часть внутри закрашенного - один раз', () => {
    const text = 'the oldestEventUuid moved, event by event'

    expect(matchSpans(text, [{ term: 'event', paint: 5 }])).toEqual([
      [10, 15],
      [27, 32],
      [36, 41],
    ])
    expect(
      matchSpans(text, [
        { term: 'oldesteventuuid', paint: 15 },
        { term: 'event', paint: 5 },
      ]),
    ).toEqual([
      [4, 19],
      [27, 32],
      [36, 41],
    ])
    expect(matchSpans(text, [])).toEqual([])
  })

  it('красит столько, сколько скажет терм: набранное начало', () => {
    const text = 'the useSelection hook and the UserCard chip'
    const terms = ['useselection', 'use', 'usercard', 'user'].map((term) => ({ term, paint: 3 }))

    expect(matchSpans(text, terms)).toEqual([
      [4, 7],
      [30, 33],
    ])
    expect(matchSpans('почему Deepgram молчит', [{ term: 'deepgram', paint: 6 }])).toEqual([
      [7, 13],
    ])
  })

  it('держится целых слов и набранного регистра, когда терм просит', () => {
    const text = 'a Member of the team, every member, and the memberCard'

    expect(matchSpans(text, [{ term: 'member', paint: 6, whole: true }])).toEqual([
      [2, 8],
      [28, 34],
    ])
    expect(matchSpans(text, [{ term: 'member', paint: 6, text: 'Member' }])).toEqual([[2, 8]])
    expect(matchSpans(text, [{ term: 'member', paint: 6, text: 'member' }])).toEqual([
      [28, 34],
      [44, 50],
    ])
    expect(matchSpans(text, [{ term: 'member', paint: 3, text: 'mem' }])).toEqual([
      [28, 31],
      [44, 47],
    ])
  })
})
