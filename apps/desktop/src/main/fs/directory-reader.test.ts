import { rm, mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, afterAll, describe, beforeAll } from 'vitest'

import { readDirectory } from './directory-reader'

describe('readDirectory', () => {
  let root = ''

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'amazing-ide-tree-'))
    await mkdir(join(root, 'src'))
    await mkdir(join(root, '.git'))
    await writeFile(join(root, 'file10.ts'), '')
    await writeFile(join(root, 'file2.ts'), '')
    await writeFile(join(root, 'README.md'), '')
    await writeFile(join(root, 'src', 'index.ts'), '')
    await symlink(join(root, 'src'), join(root, 'linked-src'))
    await symlink(join(root, 'missing'), join(root, 'broken-link'))
  })

  afterAll(() => rm(root, { recursive: true, force: true }))

  it('папки сверху, числа по порядку, .git скрыт, ссылки по цели', async () => {
    const entries = await readDirectory(root, '')

    expect(entries.map(({ name, kind, isSymlink }) => [name, kind, isSymlink])).toEqual([
      ['linked-src', 'directory', true],
      ['src', 'directory', false],
      ['broken-link', 'file', true],
      ['file2.ts', 'file', false],
      ['file10.ts', 'file', false],
      ['README.md', 'file', false],
    ])
  })

  it('пути вложенных элементов - от корня проекта', async () => {
    const entries = await readDirectory(root, 'src')

    expect(entries).toEqual([
      { name: 'index.ts', relativePath: 'src/index.ts', kind: 'file', isSymlink: false },
    ])
  })

  it('путь за пределы проекта не читается', async () => {
    await expect(readDirectory(root, '..')).rejects.toThrow('за пределы проекта')
  })
})
