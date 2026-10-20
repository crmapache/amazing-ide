import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { chipPath, describePaths } from './attachment-paths'

describe('пути вложений', () => {
  let root = ''

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'attach-'))
    await mkdir(join(root, 'src'))
    await writeFile(join(root, 'src', 'a.ts'), '')
    await writeFile(join(root, 'shot.PNG'), '')
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('внутри проекта - от корня, снаружи - целиком', () => {
    expect(chipPath('/p', '/p/src/a.ts')).toBe('src/a.ts')
    expect(chipPath('/p', '/other/a.ts')).toBe('/other/a.ts')
    expect(chipPath('/p', '/p')).toBe('/p')
  })

  it('файл, картинка и папка; относительное и несуществующее - мимо', async () => {
    const found = await describePaths(root, [
      join(root, 'src', 'a.ts'),
      join(root, 'shot.PNG'),
      join(root, 'src'),
      'relative/x.ts',
      join(root, 'missing.ts'),
    ])

    expect(found).toEqual([
      { path: 'src/a.ts', kind: 'file' },
      { path: 'shot.PNG', kind: 'img' },
      { path: 'src/', kind: 'dir' },
    ])
  })
})
