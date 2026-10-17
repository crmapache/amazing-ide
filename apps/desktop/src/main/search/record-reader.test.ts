import { it, expect, describe } from 'vitest'

import { RecordReader } from './record-reader'
import { GREP_DELIMITERS, LS_FILES_DELIMITERS } from './search.constants'

const readAll = (delimiters: readonly number[], chunks: Buffer[], maxFieldBytes?: number) => {
  const reader = new RecordReader(delimiters, maxFieldBytes)

  return chunks.flatMap((chunk) => reader.push(chunk))
}

const fieldsOf = (delimiters: readonly number[], chunks: Buffer[]) =>
  readAll(delimiters, chunks).map(({ fields }) => fields)

describe('RecordReader', () => {
  // Путь с переводом строки, кириллица и ноль внутри текста строки - всё, что могло
  // бы сбить разбор, если резать не по полям.
  const grepOutput = Buffer.from(
    'src/a.ts\x0012\x00const Привет = 1\nодин\nдва.txt\x003\x00a\x00b\n',
  )
  const expected = [
    ['src/a.ts', '12', 'const Привет = 1'],
    ['один\nдва.txt', '3', 'a\x00b'],
  ]

  it('вывод git grep: путь, номер, текст', () => {
    expect(fieldsOf(GREP_DELIMITERS, [grepOutput])).toEqual(expected)
  })

  it('кусок потока рвётся где угодно, в том числе посреди буквы UTF-8', () => {
    for (let cut = 1; cut < grepOutput.length; cut += 1) {
      const chunks = [grepOutput.subarray(0, cut), grepOutput.subarray(cut)]

      expect(fieldsOf(GREP_DELIMITERS, chunks)).toEqual(expected)
    }
  })

  it('по одному байту', () => {
    const bytes = [...grepOutput].map((byte) => Buffer.from([byte]))

    expect(fieldsOf(GREP_DELIMITERS, bytes)).toEqual(expected)
  })

  it('незаконченная запись ждёт следующего куска', () => {
    const reader = new RecordReader(LS_FILES_DELIMITERS)

    expect(reader.push(Buffer.from('a.ts\x00src/b'))).toEqual([
      { fields: ['a.ts'], clipped: false },
    ])
    expect(reader.push(Buffer.from('.ts\x00'))).toEqual([{ fields: ['src/b.ts'], clipped: false }])
  })

  it('поле длиннее предела: держится начало, остаток до разделителя пропущен', () => {
    const output = Buffer.from(`min.js\x001\x00${'a'.repeat(20)}\nb.ts\x002\x00short\n`)
    const expected = [
      { fields: ['min.js', '1', 'a'.repeat(8)], clipped: true },
      { fields: ['b.ts', '2', 'short'], clipped: false },
    ]

    expect(readAll(GREP_DELIMITERS, [output], 8)).toEqual(expected)

    // Тот же итог, как бы ни рвался поток: предел считается по полю, а не по куску.
    for (let cut = 1; cut < output.length; cut += 1) {
      const chunks = [output.subarray(0, cut), output.subarray(cut)]

      expect(readAll(GREP_DELIMITERS, chunks, 8)).toEqual(expected)
    }
  })

  it('обрезка посреди буквы UTF-8 не оставляет «�»', () => {
    // «ж» - два байта: предел в 3 байта режет вторую букву пополам.
    const [record] = readAll(GREP_DELIMITERS, [Buffer.from('a\x001\x00жжж\n')], 3)

    expect(record).toEqual({ fields: ['a', '1', 'ж'], clipped: true })
  })
})
