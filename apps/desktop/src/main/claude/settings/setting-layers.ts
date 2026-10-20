import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { SettingSources } from '@shared/claude-prefs'

/**
 * Слои настроек Claude Code - те же файлы, что читает CLI, от сильного к слабому:
 * политика организации, локальный файл проекта, общий файл проекта, настройки
 * человека. Первое найденное значение и действует. Файлы репозитория сильнее личных:
 * для разрешений и хуков это верно, а блок `env` из них перебивает вход, сделанный на
 * этой машине (Settings sources).
 */
export type SettingsLayer = 'policy' | 'local' | 'project' | 'user'

export type LayerFile = { layer: SettingsLayer; file: string }

/** Файл слоя, уже прочитанный: битый или отсутствующий - пустой объект. */
export type LayerSettings = { layer: SettingsLayer; settings: Record<string, unknown> }

/** Политика организации на macOS: файл и папка его кусков рядом (CLI читает все). */
const MANAGED_DIR = '/Library/Application Support/ClaudeCode'
const MANAGED_FILE = 'managed-settings.json'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Какие слои читает проект при выбранных источниках. Политика - всегда: флаг
 * `--setting-sources` её не знает, настройки организации действуют при любом выборе.
 */
export const loadedLayers = (sources: SettingSources): readonly SettingsLayer[] => {
  if (sources === 'user') return ['policy', 'user']
  if (sources === 'noLocal') return ['policy', 'project', 'user']

  return ['policy', 'local', 'project', 'user']
}

/**
 * Аргумент `--setting-sources` - словами CLI. null - флаг не передаётся вовсе: машина,
 * где экран не открывали, запускает CLI ровно как до появления настройки.
 */
export const settingSourcesArg = (sources: SettingSources): string | null => {
  if (sources === 'user') return 'user'
  if (sources === 'noLocal') return 'user,project'

  return null
}

/** Локальный и общий файлы настроек репозитория - сильный первым. */
export const repositoryFiles = (projectPath: string): LayerFile[] => [
  { layer: 'local', file: join(projectPath, '.claude', 'settings.local.json') },
  { layer: 'project', file: join(projectPath, '.claude', 'settings.json') },
]

/**
 * Файлы слоёв проекта от сильного к слабому - только те, что CLI велено читать.
 * Что панель читает, обязано совпадать с тем, с чем она запускает: режим из слоя,
 * который процесс не грузит, назвал бы режим, в котором он не поднимется.
 */
export const layerFiles = async (
  projectPath: string,
  claudeHome: string,
  sources: SettingSources,
): Promise<LayerFile[]> => {
  const wanted = loadedLayers(sources)
  const piecesDir = join(MANAGED_DIR, `${MANAGED_FILE}.d`)
  const pieces = (await readdir(piecesDir).catch(() => []))
    .filter((name) => name.endsWith('.json'))
    .sort()
  const files: LayerFile[] = [
    { layer: 'policy', file: join(MANAGED_DIR, MANAGED_FILE) },
    ...pieces.map((name): LayerFile => ({ layer: 'policy', file: join(piecesDir, name) })),
    ...repositoryFiles(projectPath),
    { layer: 'user', file: join(claudeHome, 'settings.json') },
  ]

  return files.filter((item) => wanted.includes(item.layer))
}

/** Объект JSON из файла. Нет файла или он битый - пустой: чужой файл не роняет панель. */
export const readSettingsObject = async (file: string): Promise<Record<string, unknown>> => {
  try {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'))

    return isRecord(value) ? value : {}
  } catch {
    return {}
  }
}

/** Прочитать файлы слоёв, сохранив порядок. */
export const readLayers = async (files: readonly LayerFile[]): Promise<LayerSettings[]> =>
  Promise.all(
    files.map(async ({ layer, file }) => ({ layer, settings: await readSettingsObject(file) })),
  )
