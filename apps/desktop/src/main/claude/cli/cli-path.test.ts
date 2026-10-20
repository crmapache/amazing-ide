import { rm, chmod, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { checkCliPath, searchedPlaces } from './cli-path'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cli-path-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** Исполняемый скрипт, который отвечает на --version заданной строкой. */
const fakeCli = async (name: string, version: string) => {
  const file = join(dir, name)

  await writeFile(file, `#!/bin/sh\necho '${version}'\n`)
  await chmod(file, 0o755)

  return file
}

describe('путь к CLI руками', () => {
  it('отвечает как Claude Code - годный', async () => {
    const file = await fakeCli('claude', '2.1.293 (Claude Code)')

    expect(await checkCliPath(file, { PATH: '/usr/bin:/bin' })).toBeNull()
  })

  it('другая программа - не Claude Code', async () => {
    const file = await fakeCli('claude', 'something else 1.0')

    expect(await checkCliPath(file, { PATH: '/usr/bin:/bin' })).toBe('not-claude')
  })

  it('нет файла или путь не абсолютный', async () => {
    expect(await checkCliPath(join(dir, 'nope'), {})).toBe('missing')
    expect(await checkCliPath('claude', {})).toBe('missing')
  })

  it('где искали: названный путь, папки PATH без повторов и оболочка', () => {
    expect(searchedPlaces('/a:/b::/a', '/opt/claude')).toEqual([
      '/opt/claude',
      '/a/claude',
      '/b/claude',
      'command -v claude',
    ])
  })
})
