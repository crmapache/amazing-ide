import { it, expect, describe } from 'vitest'

import type { GitChange } from '@shared/git'

import { diffNotes, diffState, headPathOf, diffSummary, neighbourChanges } from './DiffEditor.utils'

const change = (path: string, kind: GitChange['kind'], origin: string | null = null) => ({
  path,
  kind,
  origin,
})

const TEXT = { kind: 'text', readOnly: false, notice: null, bom: false } as const

describe('headPathOf', () => {
  it('переименованный - по прежнему пути, новый - нигде, не изменённый - по своему', () => {
    expect(headPathOf(change('b.ts', 'renamed', 'a.ts'), 'b.ts')).toBe('a.ts')
    expect(headPathOf(change('n.ts', 'untracked'), 'n.ts')).toBeNull()
    expect(headPathOf(change('n.ts', 'added'), 'n.ts')).toBeNull()
    expect(headPathOf(null, 'x.ts')).toBe('x.ts')
  })
})

describe('diffState', () => {
  it('обе стороны готовы - разница; у нового файла слева пусто', () => {
    expect(
      diffState({
        change: change('n.ts', 'untracked'),
        hasHead: false,
        head: undefined,
        status: TEXT,
      }),
    ).toEqual({ kind: 'ready', original: '', modified: 'document', readOnly: false })
  })

  it('удалённый: документ не нужен, справа пусто и не правится', () => {
    expect(
      diffState({
        change: change('d.ts', 'deleted'),
        hasHead: true,
        head: { kind: 'text', text: 'old\n', bom: false },
        status: { kind: 'loading' },
      }),
    ).toEqual({ kind: 'ready', original: 'old\n', modified: 'empty', readOnly: true })
  })

  it('файла нет на диске, хоть он и не в списке удалённых, - справа пусто, а не «ждать»', () => {
    expect(
      diffState({
        change: null,
        hasHead: true,
        head: { kind: 'missing' },
        status: { kind: 'missing' },
      }),
    ).toEqual({ kind: 'ready', original: '', modified: 'empty', readOnly: true })
  })

  it('не текст с любой стороны - словами, не дожидаясь второй', () => {
    expect(
      diffState({ change: null, hasHead: true, head: undefined, status: { kind: 'binary' } }).kind,
    ).toBe('fileProblem')
    expect(
      diffState({
        change: null,
        hasHead: true,
        head: { kind: 'binary' },
        status: { kind: 'loading' },
      }).kind,
    ).toBe('headProblem')
  })

  it('сторона ещё читается - ждать', () => {
    expect(diffState({ change: null, hasHead: true, head: undefined, status: TEXT }).kind).toBe(
      'loading',
    )
  })
})

describe('neighbourChanges', () => {
  const files = [change('a.ts', 'modified'), change('b.ts', 'added'), change('c.ts', 'untracked')]

  it('соседи по порядку списка; у краёв и вне списка - никого', () => {
    expect(neighbourChanges(files, 'b.ts')).toEqual({ previous: files[0], next: files[2] })
    expect(neighbourChanges(files, 'a.ts').previous).toBeNull()
    expect(neighbourChanges(files, 'gone.ts')).toEqual({ previous: null, next: null })
  })
})

describe('diffNotes', () => {
  it('метка BOM в коммите и на диске разная, права поменялись - обе пометки', () => {
    expect(
      diffNotes({
        change: { ...change('a.ts', 'modified'), modeChanged: true },
        head: { kind: 'text', text: 'a', bom: true },
        status: TEXT,
        eolChanged: false,
      }),
    ).toEqual(['bom', 'mode'])
  })
})

describe('diffSummary', () => {
  it('нет различий в строках, но поменялись переводы строк или права - так и сказать', () => {
    expect(diffSummary({ isCounting: false, count: 0, notes: ['eol', 'mode'] })).toEqual({
      key: 'noTextDifferences',
      count: 0,
      notes: ['eol', 'mode'],
    })
    expect(diffSummary({ isCounting: false, count: 0, notes: [] }).key).toBe('noDifferences')
    expect(diffSummary({ isCounting: false, count: 3, notes: ['mode'] }).key).toBe('differences')
    expect(diffSummary({ isCounting: true, count: null, notes: [] }).key).toBe('counting')
  })
})
