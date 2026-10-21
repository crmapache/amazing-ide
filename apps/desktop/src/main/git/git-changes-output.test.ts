import { it, expect, describe } from 'vitest'

import { GitChangesParser } from './git-changes-output'
import type { GitScope } from './git-status-output'

const HASHES = '100644 100644 100644 aaaa bbbb'

const ordinary = (xy: string, path: string, sub = 'N...') => `1 ${xy} ${sub} ${HASHES} ${path}`

const moved = (xy: string, path: string, sub = 'N...') => `2 ${xy} ${sub} ${HASHES} R100 ${path}`

const parse = (
  records: string[],
  scope: GitScope = { prefix: '', ignoreCase: false },
  limit = 100,
) => {
  const parser = new GitChangesParser(scope, limit)

  records.every((record) => parser.push(record))

  return parser.result()
}

describe('GitChangesParser', () => {
  it('переименование - с прежним путём; удалённое после него - удаление прежнего файла', () => {
    expect(parse([moved('R.', 'b.ts'), 'a.ts', moved('RD', 'd.ts'), 'c.ts']).files).toEqual([
      { path: 'b.ts', kind: 'renamed', origin: 'a.ts' },
      { path: 'c.ts', kind: 'deleted', origin: null },
    ])
  })

  it('копия - новый файл: источник на месте', () => {
    expect(parse([moved('C.', 'copy.ts'), 'src.ts']).files).toEqual([
      { path: 'copy.ts', kind: 'added', origin: null },
    ])
  })

  it('подмодули и вложенные репозитории в список не попадают', () => {
    expect(
      parse([ordinary('.M', 'lib/sub', 'SC..'), moved('R.', 'x', 'S...'), 'y', '? vendor/repo/'])
        .files,
    ).toEqual([])
  })

  it('добавленный с намерением - новый, добавленный и стёртый с диска - не строка', () => {
    expect(parse([ordinary('.A', 'intent.ts'), ordinary('AD', 'brief.ts')]).files).toEqual([
      { path: 'intent.ts', kind: 'added', origin: null },
    ])
  })

  it('проект в подпапке: префикс без учёта регистра, если репозиторий его не различает', () => {
    const scope = { prefix: 'apps/web/', ignoreCase: true }

    expect(
      parse([ordinary('.M', 'Apps/Web/Page.ts'), ordinary('.M', 'apps/api/x.ts')], scope).files,
    ).toEqual([{ path: 'Page.ts', kind: 'modified', origin: null }])
  })

  it('переезд из-за пределов проекта - просто новый файл', () => {
    const scope = { prefix: 'web/', ignoreCase: false }

    expect(parse([moved('R.', 'web/a.ts'), 'api/a.ts'], scope).files).toEqual([
      { path: 'a.ts', kind: 'added', origin: null },
    ])
  })

  it('больше предела - список обрезан', () => {
    const changes = parse(['? a.ts', '? b.ts', '? c.ts'], undefined, 2)

    expect(changes.files.map((change) => change.path)).toEqual(['a.ts', 'b.ts'])
    expect(changes.truncated).toBe(true)
  })

  it('«удалён в индексе» и «новый» на один путь (git rm --cached) - одна изменённая строка', () => {
    expect(parse([ordinary('D.', 'keep.txt'), '? keep.txt', '? other.txt']).files).toEqual([
      { path: 'keep.txt', kind: 'modified', origin: null },
      { path: 'other.txt', kind: 'untracked', origin: null },
    ])
  })

  it('права в HEAD и на диске разные - отмечено; у нового и удалённого - нет', () => {
    const modes = (head: string, worktree: string, xy: string, path: string) =>
      `1 ${xy} N... ${head} ${head} ${worktree} aaaa bbbb ${path}`

    expect(
      parse([
        modes('100644', '100755', '.M', 'run.sh'),
        modes('100644', '100644', '.M', 'same.ts'),
        modes('100644', '000000', '.D', 'gone.ts'),
      ]).files,
    ).toEqual([
      { path: 'run.sh', kind: 'modified', origin: null, modeChanged: true },
      { path: 'same.ts', kind: 'modified', origin: null },
      { path: 'gone.ts', kind: 'deleted', origin: null },
    ])
  })
})
