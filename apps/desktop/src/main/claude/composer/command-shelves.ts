import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { CommandShelf } from './command-scan'

/**
 * Полки команд для подсказки «/» по старшинству CLI: проект, свои, плагины. Плагины -
 * установленные (`plugins/installed_plugins.json`) и включённые для этого проекта:
 * включение - слоями настроек, проект поверх своих.
 */

const readJson = async (file: string): Promise<Record<string, unknown>> => {
  try {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'))

    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

/** Включён ли плагин: слои настроек, младшие перекрывают старших. */
const enabledPlugins = async (projectPath: string, home: string) => {
  const layers = await Promise.all(
    [
      join(home, 'settings.json'),
      join(projectPath, '.claude', 'settings.json'),
      join(projectPath, '.claude', 'settings.local.json'),
    ].map(readJson),
  )

  return Object.assign({}, ...layers.map((layer) => record(layer['enabledPlugins']))) as Record<
    string,
    unknown
  >
}

/**
 * Папки установленных плагинов, видимых в этом проекте: установка для человека - везде,
 * установка для проекта - только в нём. Выключенный плагин - мимо.
 */
export const pluginShelves = async (projectPath: string, home: string): Promise<CommandShelf[]> => {
  const installed = record(
    (await readJson(join(home, 'plugins', 'installed_plugins.json')))['plugins'],
  )
  const enabled = await enabledPlugins(projectPath, home)

  return Object.entries(installed).flatMap(([id, entries]) => {
    if (enabled[id] === false || !Array.isArray(entries)) return []

    const entry = entries.map(record).find((item) => {
      const scope = item['scope']

      return scope === 'user' || item['projectPath'] === projectPath
    })
    const installPath = entry?.['installPath']

    if (typeof installPath !== 'string') return []

    const prefix = `${id.split('@')[0] ?? id}:`

    return [
      { commands: join(installPath, 'commands'), skills: join(installPath, 'skills'), prefix },
    ]
  })
}

/** Все полки проекта по старшинству. */
export const commandShelves = async (
  projectPath: string,
  home: string,
): Promise<CommandShelf[]> => [
  {
    commands: join(projectPath, '.claude', 'commands'),
    skills: join(projectPath, '.claude', 'skills'),
    prefix: '',
  },
  { commands: join(home, 'commands'), skills: join(home, 'skills'), prefix: '' },
  ...(await pluginShelves(projectPath, home)),
]
