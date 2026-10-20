import { rm, utimes, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { PASTED_MAX_AGE_MS } from './composer.constants'
import { pastedName, sweepPasted, writePasted } from './pasted-files'

describe('вставленные файлы', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pasted-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('имя чистится, пустое - по времени', () => {
    const now = new Date('2026-10-19T10:20:30.000Z')

    expect(pastedName('../../etc/passwd', now)).toBe('_.._etc_passwd')
    expect(pastedName('отчёт 2026.pdf', now)).toBe('отчёт 2026.pdf')
    expect(pastedName('', now)).toBe('Pasted 2026-10-19 10-20-30.png')
  })

  it('два файла с одним именем не затирают друг друга', async () => {
    const [first, second] = await Promise.all([
      writePasted(dir, 'shot.png', Buffer.from('a')),
      writePasted(dir, 'shot.png', Buffer.from('b')),
    ])

    expect(new Set([first, second]).size).toBe(2)
    expect((await readdir(dir)).sort()).toEqual(['shot 2.png', 'shot.png'])
    expect([await readFile(first, 'utf8'), await readFile(second, 'utf8')].sort()).toEqual([
      'a',
      'b',
    ])
  })

  it('метёт только старше срока', async () => {
    const now = Date.now()
    const old = join(dir, 'old.png')

    await writeFile(old, 'x')
    await writeFile(join(dir, 'fresh.png'), 'y')
    await utimes(
      old,
      new Date(now - PASTED_MAX_AGE_MS - 1000),
      new Date(now - PASTED_MAX_AGE_MS - 1000),
    )
    await sweepPasted(dir, now)

    expect(await readdir(dir)).toEqual(['fresh.png'])
  })
})
