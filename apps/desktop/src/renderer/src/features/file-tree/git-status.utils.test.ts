import { it, expect, describe } from 'vitest'

import type { GitStatus } from '@shared/git'

import { treeStatusOf } from './git-status.utils'

const STATUS: GitStatus = {
  files: {
    'src/app.ts': 'modified',
    'src/new.ts': 'added',
    'drafts/keep.log': 'ignored',
    'libs/sub': 'modified',
  },
  folders: { drafts: 'untracked', out: 'ignored' },
  changedFolders: { src: 'modified', libs: 'conflict' },
  truncated: false,
  ignoreCase: false,
}

describe('treeStatusOf', () => {
  it('свой статус файла', () => {
    expect(treeStatusOf(STATUS, 'src/app.ts', false)).toBe('modified')
    expect(treeStatusOf(STATUS, 'src/new.ts', false)).toBe('added')
    expect(treeStatusOf(STATUS, 'src/same.ts', false)).toBeNull()
  })

  it('внутри новой или игнорируемой папки - её статус, свой важнее', () => {
    expect(treeStatusOf(STATUS, 'drafts/idea.md', false)).toBe('untracked')
    expect(treeStatusOf(STATUS, 'drafts/keep.log', false)).toBe('ignored')
    expect(treeStatusOf(STATUS, 'out/deep/bundle.js', false)).toBe('ignored')
    expect(treeStatusOf(STATUS, 'out', true)).toBe('ignored')
  })

  it('папка с изменениями внутри; подмодуль - как файл', () => {
    expect(treeStatusOf(STATUS, 'src', true)).toBe('modified')
    expect(treeStatusOf(STATUS, 'libs', true)).toBe('conflict')
    expect(treeStatusOf(STATUS, 'libs/sub', true)).toBe('modified')
    expect(treeStatusOf(STATUS, 'docs', true)).toBeNull()
  })

  it('проект целиком новый - всё новое', () => {
    const fresh: GitStatus = { ...STATUS, folders: { '': 'untracked' } }

    expect(treeStatusOf(fresh, 'any/file.ts', false)).toBe('untracked')
  })

  it('репозиторий без регистра - путь с диска в любом регистре', () => {
    const insensitive: GitStatus = { ...STATUS, ignoreCase: true }

    expect(treeStatusOf(insensitive, 'Src/App.ts', false)).toBe('modified')
    expect(treeStatusOf(insensitive, 'SRC', true)).toBe('modified')
    expect(treeStatusOf(STATUS, 'Src/App.ts', false)).toBeNull()
  })

  it('без статуса и с именами из прототипа - без цвета', () => {
    expect(treeStatusOf(null, 'src/app.ts', false)).toBeNull()
    expect(treeStatusOf(STATUS, 'constructor', false)).toBeNull()
    expect(treeStatusOf(STATUS, 'toString', true)).toBeNull()
  })
})
