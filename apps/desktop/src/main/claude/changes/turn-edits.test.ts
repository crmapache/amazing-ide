import { it, expect, describe } from 'vitest'

import { entryOf, filesOf, TurnEdits } from './turn-edits'

const writeCall = (id: string, path: string, content: string) => ({
  type: 'assistant',
  message: {
    content: [{ type: 'tool_use', id, name: 'Write', input: { file_path: path, content } }],
  },
})

const answer = (id: string, structured: Record<string, unknown>, field = 'tool_use_result') => ({
  type: 'user',
  message: { content: [{ type: 'tool_result', tool_use_id: id, content: 'ok' }] },
  [field]: structured,
})

const hunk = { oldStart: 2, newStart: 3, lines: [' x', '+y'] }

describe('правка по результату CLI', () => {
  it('дифф, созданный файл, большая правка без диффа и запись того же текста', () => {
    expect(entryOf({ filePath: '/p/a', structuredPatch: [hunk] }, undefined)).toEqual({
      path: '/p/a',
      edit: { kind: 'patch', hunks: [hunk] },
    })
    expect(entryOf({ filePath: '/p/b', type: 'create', content: 'more' }, 'hi')).toEqual({
      path: '/p/b',
      edit: { kind: 'create', content: 'hi' },
    })
    // Рядом с большой правкой CLI шлёт обрезанный originalFile - это не «ничего не изменилось».
    expect(
      entryOf({ filePath: '/p/c', structuredPatch: [], originalFile: 'x = fo' }, undefined),
    ).toEqual({ path: '/p/c', edit: 'undiffed' })
    expect(
      entryOf({ filePath: '/p/d', structuredPatch: [], originalFile: 'same' }, 'same'),
    ).toEqual({ path: '/p/d', edit: 'unchanged' })
    expect(entryOf({ filePath: '/p/e', structuredPatch: [{ lines: ['+y'] }] }, undefined)).toEqual({
      path: '/p/e',
      edit: 'undiffed',
    })
    expect(entryOf('Error: file not found', undefined)).toBeNull()
  })
})

describe('учёт правок хода', () => {
  it('Write - по тексту вызова, транскрипт и поток читаются одинаково, пачка результатов - мимо', () => {
    const edits = new TurnEdits()

    edits.observe(writeCall('w', '/p/mem.md', 'name: x\n'))
    edits.observe(
      answer('w', { filePath: '/p/mem.md', type: 'create', content: 'name: x\nmore\n' }),
    )
    edits.observe(answer('e', { filePath: '/p/a.ts', structuredPatch: [hunk] }, 'toolUseResult'))
    edits.observe({
      type: 'user',
      message: {
        content: [
          { type: 'tool_result', tool_use_id: 'm1' },
          { type: 'tool_result', tool_use_id: 'm2' },
        ],
      },
      tool_use_result: { filePath: '/p/x.ts', structuredPatch: [hunk] },
    })

    const files = filesOf(edits.entriesOf(['w', 'e', 'm1', 'm2']))

    expect([...files.keys()]).toEqual(['/p/mem.md', '/p/a.ts'])
    expect(files.get('/p/mem.md')?.edits).toEqual([{ kind: 'create', content: 'name: x\n' }])

    edits.forget()
    expect(edits.entriesOf(['w', 'e']).size).toBe(0)
  })

  it('по файлу: правки по порядку, большая без диффа - «должен», все без изменений - unchanged', () => {
    const files = filesOf(
      new Map([
        ['1', { path: '/p/a', edit: { kind: 'patch' as const, hunks: [hunk] } }],
        ['2', { path: '/p/a', edit: 'undiffed' as const }],
        ['3', { path: '/p/same', edit: 'unchanged' as const }],
      ]),
    )

    expect(files.get('/p/a')).toEqual({
      path: '/p/a',
      edits: [{ kind: 'patch', hunks: [hunk] }],
      owing: true,
      unchanged: false,
    })
    expect(files.get('/p/same')).toEqual({
      path: '/p/same',
      edits: [],
      owing: false,
      unchanged: true,
    })
  })
})
