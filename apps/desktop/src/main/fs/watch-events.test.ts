import { it, expect, describe } from 'vitest'

import { classifyGitDirEvent, classifyProjectEvent, classifyOuterIgnoreEvent } from './watch-events'

describe('classifyProjectEvent', () => {
  it('появился, пропал или переименовался - rename', () => {
    expect(classifyProjectEvent('rename', 'src/app/new.ts')).toEqual({
      path: 'src/app/new.ts',
      renamed: true,
      rescan: false,
      git: false,
    })
  })

  it('поменялось содержимое - путь тот же, переименования нет', () => {
    expect(classifyProjectEvent('change', 'src/app.ts')).toEqual({
      path: 'src/app.ts',
      renamed: false,
      rescan: false,
      git: false,
    })
  })

  it('.git - не дерево, а статус и ветка; объекты и журналы не важны', () => {
    expect(classifyProjectEvent('rename', '.git/index')).toEqual({
      path: null,
      renamed: false,
      rescan: false,
      git: true,
    })
    expect(classifyProjectEvent('change', '.git/HEAD')?.git).toBe(true)
    expect(classifyProjectEvent('rename', '.git/objects/ab/cdef')).toBeNull()
    expect(classifyProjectEvent('change', '.git/logs/HEAD')).toBeNull()
  })

  it('служебное, которого нет в дереве, и чужой .git - пропускаются', () => {
    expect(classifyProjectEvent('rename', 'src/.DS_Store')).toBeNull()
    expect(classifyProjectEvent('change', 'vendor/lib/.git/index')).toBeNull()
  })

  it('без имени - поменялось неизвестно что, значит, всё', () => {
    expect(classifyProjectEvent('rename', null)).toEqual({
      path: null,
      renamed: false,
      rescan: true,
      git: true,
    })
  })

  it('имена в NFD - в NFC, как ключи дерева', () => {
    const nfd = 'папка/й.md'.normalize('NFD')

    expect(classifyProjectEvent('rename', nfd)?.path).toBe('папка/й.md'.normalize('NFC'))
  })
})

describe('classifyGitDirEvent', () => {
  it('ветка, индекс, ссылки, слияние, исключения, подмодули - важны', () => {
    for (const path of [
      '',
      'HEAD',
      'index',
      'refs/heads/main',
      'packed-refs',
      'MERGE_HEAD',
      'rebase-merge/done',
      'info/exclude',
      'modules/vendor/lib/index',
    ]) {
      expect(classifyGitDirEvent(path)?.git, path).toBe(true)
    }
  })

  it('шум: объекты, журналы, блокировки, fsmonitor, LFS, чужие worktree', () => {
    for (const path of [
      'objects/pack/x.pack',
      'logs/HEAD',
      'index.lock',
      'fsmonitor--daemon/cookies/123-0',
      'fsmonitor--daemon.ipc',
      'lfs/objects/ab/cd',
      'modules/vendor/objects/ab',
      'worktrees/agent/index',
      'FETCH_HEAD',
    ]) {
      expect(classifyGitDirEvent(path), path).toBeNull()
    }
  })
})

describe('classifyOuterIgnoreEvent', () => {
  it('над проектом важен только .gitignore', () => {
    expect(classifyOuterIgnoreEvent('.gitignore')?.git).toBe(true)
    expect(classifyOuterIgnoreEvent('README.md')).toBeNull()
    expect(classifyOuterIgnoreEvent(null)).toBeNull()
  })
})
