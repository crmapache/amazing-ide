import { it, expect, describe } from 'vitest'

import { MatchCollector } from './match-collector'
import { TEXT_MATCHES_LIMIT, TEXT_MATCHES_PER_FILE_LIMIT } from './search.constants'

const fill = (collector: MatchCollector, files: number, perFile: number) => {
  for (let file = 0; file < files; file += 1) {
    for (let line = 1; line <= perFile; line += 1) {
      if (!collector.add(`f${file}.ts`, line, 'hit')) return false
    }
  }

  return true
}

describe('MatchCollector', () => {
  it('превью строится сразу, по запросу', () => {
    const collector = new MatchCollector('hit')

    collector.add('a.ts', 3, '  a HIT b')

    expect(collector.result()).toEqual({
      matches: [
        { relativePath: 'a.ts', line: 3, preview: 'a HIT b', matchStart: 2, matchLength: 3 },
      ],
      truncated: false,
    })
  })

  it('путь - в NFC, и NFD-форма того же файла считается тем же файлом', () => {
    const collector = new MatchCollector('hit')

    for (let line = 1; line <= TEXT_MATCHES_PER_FILE_LIMIT; line += 1) {
      collector.add(line % 2 ? 'и\u0306.ts' : 'й.ts', line, 'hit')
    }
    collector.add('и\u0306.ts', 99, 'hit')

    const paths = collector.result().matches.map((match) => match.relativePath)

    expect(new Set(paths)).toEqual(new Set(['й.ts']))
    expect(paths).toHaveLength(TEXT_MATCHES_PER_FILE_LIMIT)
  })

  it('лишнее в одном файле отбрасывается, поиск идёт дальше', () => {
    const collector = new MatchCollector('hit')

    expect(fill(collector, 1, TEXT_MATCHES_PER_FILE_LIMIT + 5)).toBe(true)
    expect(collector.add('other.ts', 1, 'hit')).toBe(true)
    expect(collector.result().matches).toHaveLength(TEXT_MATCHES_PER_FILE_LIMIT + 1)
    expect(collector.result().truncated).toBe(false)
  })

  it('ровно предел - ещё «всё», первое лишнее - обрезано и стоп', () => {
    const files = TEXT_MATCHES_LIMIT / TEXT_MATCHES_PER_FILE_LIMIT
    const exact = new MatchCollector('hit')

    expect(fill(exact, files, TEXT_MATCHES_PER_FILE_LIMIT)).toBe(true)
    expect(exact.result()).toMatchObject({ truncated: false })
    expect(exact.add('extra.ts', 1, 'hit')).toBe(false)
    expect(exact.result().matches).toHaveLength(TEXT_MATCHES_LIMIT)
    expect(exact.result().truncated).toBe(true)
  })

  it('прерванный поиск помечен, но найденное после пометки ещё принимается', () => {
    const collector = new MatchCollector('hit')

    collector.markIncomplete()

    expect(collector.add('a.ts', 1, 'hit')).toBe(true)
    expect(collector.result()).toMatchObject({ truncated: true })
    expect(collector.result().matches).toHaveLength(1)
  })
})
