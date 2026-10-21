import { it, expect, describe } from 'vitest'

import type { PlaceModel } from './CodeEditor.types'
import { placeRange, selectionLines } from './CodeEditor.utils'

const lines = ['import a', 'const value = 1', 'export default value']

const model: PlaceModel = {
  getLineCount: () => lines.length,
  getLineMaxColumn: (line) => (lines[line - 1]?.length ?? 0) + 1,
  getLineContent: (line) => lines[line - 1] ?? '',
  findMatches: (search) =>
    lines.flatMap((text, index) => {
      const column = text.indexOf(search)

      return column < 0
        ? []
        : [
            {
              range: {
                startLineNumber: index + 1,
                startColumn: column + 1,
                endLineNumber: index + 1,
                endColumn: column + 1 + search.length,
              },
            },
          ]
    }),
}

describe('placeRange', () => {
  it('строка и колонка - курсор; за краем файла - край', () => {
    expect(placeRange(model, { line: 2, column: 7 })).toEqual({
      startLineNumber: 2,
      startColumn: 7,
      endLineNumber: 2,
      endColumn: 7,
    })
    expect(placeRange(model, { line: 99 })).toMatchObject({ startLineNumber: 3, startColumn: 1 })
  })

  it('диапазон: конец включительно; без колонки - до конца строки', () => {
    expect(placeRange(model, { line: 2, column: 7, endLine: 2, endColumn: 11 })).toMatchObject({
      endColumn: 12,
    })
    expect(placeRange(model, { line: 1, endLine: 2 })).toMatchObject({
      endLineNumber: 2,
      endColumn: 16,
    })
  })

  it('текст строки - первое совпадение; нет совпадения или места - null', () => {
    expect(placeRange(model, { find: 'default' })).toMatchObject({
      startLineNumber: 3,
      startColumn: 8,
    })
    expect(placeRange(model, { find: 'nothing' })).toBeNull()
    expect(placeRange(model, {})).toBeNull()
  })

  it('строка и текст из поиска - совпадение в этой строке, без учёта регистра', () => {
    expect(placeRange(model, { line: 2, find: 'VALUE' })).toEqual({
      startLineNumber: 2,
      startColumn: 7,
      endLineNumber: 2,
      endColumn: 12,
    })
    expect(placeRange(model, { line: 2, find: 'absent' })).toMatchObject({
      startLineNumber: 2,
      startColumn: 1,
      endColumn: 1,
    })
  })
})

describe('selectionLines', () => {
  const range = (startLineNumber: number, endLineNumber: number, endColumn: number) => ({
    startLineNumber,
    startColumn: 1,
    endLineNumber,
    endColumn,
  })

  it('строка, в которой ничего не выделено, не считается', () => {
    expect(selectionLines(range(3, 5, 1))).toEqual({ from: 3, to: 4 })
    expect(selectionLines(range(3, 5, 4))).toEqual({ from: 3, to: 5 })
    expect(selectionLines(range(3, 3, 1))).toEqual({ from: 3, to: 3 })
  })
})
