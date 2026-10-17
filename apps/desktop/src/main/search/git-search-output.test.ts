import { it, expect, describe } from 'vitest'

import { parseGrepRecord, parseTrackedEntry, parseUntrackedEntry } from './git-search-output'

describe('parseTrackedEntry', () => {
  it('обычный файл, ссылка, удалённый с диска', () => {
    expect(parseTrackedEntry('H 100644 03ba237 0\tsrc/a.ts')).toEqual({
      path: 'src/a.ts',
      kind: 'file',
    })
    expect(parseTrackedEntry('H 120000 03ba237 0\tlinked')).toEqual({
      path: 'linked',
      kind: 'unverified',
    })
    expect(parseTrackedEntry('R 100644 03ba237 0\tgone.ts')).toEqual({
      path: 'gone.ts',
      kind: 'removed',
    })
  })

  it('стадия конфликта - тот же файл', () => {
    expect(parseTrackedEntry('M 100644 03ba237 2\tconflict.ts')).toEqual({
      path: 'conflict.ts',
      kind: 'file',
    })
  })

  it('подмодуль и sparse checkout - не файлы на диске', () => {
    expect(parseTrackedEntry('H 160000 024940e 0\tmods/sub')).toBeNull()
    expect(parseTrackedEntry('S 100644 03ba237 0\tsparse.ts')).toBeNull()
  })

  it('табуляция в имени файла остаётся в имени', () => {
    expect(parseTrackedEntry('H 100644 03ba237 0\ta\tb.ts')?.path).toBe('a\tb.ts')
  })

  it('чужой формат - null', () => {
    expect(parseTrackedEntry('')).toBeNull()
    expect(parseTrackedEntry('H 100644')).toBeNull()
  })
})

describe('parseUntrackedEntry', () => {
  it('файл проверяется на диске, вложенный репозиторий - мимо', () => {
    expect(parseUntrackedEntry('notes.md')).toEqual({ path: 'notes.md', kind: 'unverified' })
    expect(parseUntrackedEntry('nested/')).toBeNull()
    expect(parseUntrackedEntry('')).toBeNull()
  })
})

describe('parseGrepRecord', () => {
  const record = (fields: string[], clipped = false) => parseGrepRecord({ fields, clipped })

  it('путь, номер строки, текст и признак обрезки', () => {
    expect(record(['src/a.ts', '12', '  const a = 1'])).toEqual({
      relativePath: 'src/a.ts',
      line: 12,
      text: '  const a = 1',
      clipped: false,
    })
    expect(record(['min.js', '1', 'aaaa'], true)?.clipped).toBe(true)
  })

  it('пустая строка текста - тоже совпадение', () => {
    expect(record(['a.ts', '3', ''])?.text).toBe('')
  })

  it('номер не число или не все поля - null', () => {
    expect(record(['a.ts', 'x', 'text'])).toBeNull()
    expect(record(['a.ts', '0', 'text'])).toBeNull()
    expect(record(['a.ts', '', 'text'])).toBeNull()
    expect(record(['a.ts', '1'])).toBeNull()
    expect(record(['', '1', 'text'])).toBeNull()
  })
})
