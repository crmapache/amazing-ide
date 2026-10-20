import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { scanShelves, parseFrontmatter } from './command-scan'
import { commandShelves } from './command-shelves'

const put = async (file: string, content: string) => {
  await mkdir(join(file, '..'), { recursive: true })
  await writeFile(file, content)
}

describe('команды с диска', () => {
  let base = ''

  beforeEach(async () => {
    base = await mkdtemp(join(tmpdir(), 'commands-'))
  })

  afterEach(async () => {
    await rm(base, { recursive: true, force: true })
  })

  it('frontmatter: описание, синтаксис, кавычки и блок со строками ниже', () => {
    expect(
      parseFrontmatter('---\ndescription: "Ship it"\nargument-hint: [branch]\n---\nbody'),
    ).toEqual({ description: 'Ship it', argumentHint: '[branch]' })
    expect(parseFrontmatter('---\ndescription: >\n  two\n  lines\nname: x\n---\n')).toEqual({
      description: 'two lines',
      argumentHint: '',
    })
    expect(parseFrontmatter('no frontmatter')).toEqual({ description: '', argumentHint: '' })
  })

  it('подпапка - через двоеточие, первое имя выигрывает, плагины с приставкой', async () => {
    const project = join(base, 'project')
    const home = join(base, 'home')
    const plugin = join(base, 'plugin')

    await put(join(project, '.claude/commands/ship.md'), '---\ndescription: project ship\n---')
    await put(join(project, '.claude/commands/demo/deep/twice.md'), 'no frontmatter')
    await put(join(project, '.claude/skills/review/SKILL.md'), '---\ndescription: review\n---')
    await put(join(home, 'commands/ship.md'), '---\ndescription: mine\n---')
    await put(join(plugin, 'commands/hello.md'), '---\ndescription: hi\n---')
    await put(join(plugin, 'skills/off/SKILL.md'), '')
    await put(
      join(home, 'plugins/installed_plugins.json'),
      JSON.stringify({ plugins: { 'greet@market': [{ scope: 'user', installPath: plugin }] } }),
    )

    const hints = await scanShelves(await commandShelves(project, home))
    const names = Object.fromEntries(hints.map((hint) => [hint.name, hint.description]))

    expect(names).toEqual({
      ship: 'project ship',
      'demo:deep:twice': '',
      review: 'review',
      'greet:hello': 'hi',
      'greet:off': '',
    })
  })

  it('выключенный плагин - мимо', async () => {
    const plugin = join(base, 'plugin')
    const home = join(base, 'home')

    await put(join(plugin, 'commands/hello.md'), '')
    await put(
      join(home, 'plugins/installed_plugins.json'),
      JSON.stringify({ plugins: { 'greet@m': [{ scope: 'user', installPath: plugin }] } }),
    )
    await put(join(home, 'settings.json'), JSON.stringify({ enabledPlugins: { 'greet@m': false } }))

    expect(await scanShelves(await commandShelves(join(base, 'none'), home))).toEqual([])
  })
})
