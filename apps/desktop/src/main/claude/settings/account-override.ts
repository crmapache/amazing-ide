import { OUTRANKING } from '../accounts/account-env'
import type { LayerFile } from './setting-layers'
import { isRecord, repositoryFiles, readSettingsObject } from './setting-layers'

/**
 * Адрес, куда уходит вход. Сам не ключ, но с ним выбранный аккаунт не в деле так же,
 * как под чужим ключом: токен уходит на шлюз, который отвечает за кого-то другого.
 */
const BASE_URL = 'ANTHROPIC_BASE_URL'

/** Команда, которая печатает ключ: ключ другой дорогой. */
const API_KEY_HELPER = 'apiKeyHelper'

const WATCHED = new Set([...OUTRANKING, BASE_URL])

/** Значение задано так, как его читает CLI: пустая строка - не задано. */
const isSet = (value: unknown) =>
  (typeof value === 'string' && value !== '') ||
  typeof value === 'number' ||
  typeof value === 'boolean'

/**
 * Имена в файле настроек, которые перебивают выбранный вход: переменные `env` и
 * apiKeyHelper. Только имена: значение там - ключ, и в окно, журнал и отчёт оно не
 * попадает никогда. Странная запись рядом не уносит с собой остальные имена.
 */
export const overridingNames = (settings: Record<string, unknown>): string[] => {
  const env = settings['env']
  const names = isRecord(env)
    ? Object.entries(env)
        .filter(([name, value]) => WATCHED.has(name) && isSet(value))
        .map(([name]) => name)
    : []

  return isSet(settings[API_KEY_HELPER]) ? [...names, API_KEY_HELPER] : names
}

/** Имена из файлов репозитория - без повторов и по алфавиту. */
const namesIn = async (files: readonly LayerFile[]): Promise<string[]> => {
  const settings = await Promise.all(files.map(({ file }) => readSettingsObject(file)))

  return [...new Set(settings.flatMap(overridingNames))].sort()
}

/**
 * Что репозиторий перебивает у процесса разговора: CLI читает оба файла репозитория
 * всегда, и их `env` ложится поверх выбранного входа (как в ACC).
 */
export const repositoryOverrides = (projectPath: string): Promise<string[]> =>
  namesIn(repositoryFiles(projectPath))
