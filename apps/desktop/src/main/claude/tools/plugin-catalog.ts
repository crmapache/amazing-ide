import type { Marketplace, AvailablePlugin, InstalledPlugin } from '@shared/claude-tools'
import { PLUGIN_SCOPES } from '@shared/claude-tools'

import { isRecord, numberField, stringField, recordsField } from '../cli/cli-messages'
import { maskUrl, maskText } from './secret-mask'
import { DESCRIPTION_MAX_CHARS } from './tools.constants'

/** Разбор JSON из вывода CLI: перед ним бывают предупреждения строками. */
export const parseCliJson = (output: string): unknown => {
  const start = output.search(/[[{]/)

  if (start < 0) return null

  try {
    return JSON.parse(output.slice(start)) as unknown
  } catch {
    return null
  }
}

const splitId = (id: string) => {
  const at = id.lastIndexOf('@')

  return at > 0
    ? { name: id.slice(0, at), marketplace: id.slice(at + 1) }
    : { name: id, marketplace: '' }
}

/**
 * Установленные плагины для проекта: свои (user) и этого проекта (project, local -
 * у них projectPath). Один плагин в нескольких областях - строкой на область.
 * projectPaths - путь проекта, как его открыла IDE, и настоящий: CLI пишет настоящий,
 * а проект мог открыться через симлинк.
 */
export const installedFor = (reply: unknown, projectPaths: readonly string[]): InstalledPlugin[] =>
  (isRecord(reply) ? recordsField(reply, 'installed') : [])
    .filter((plugin) => {
      const scope = stringField(plugin, 'scope')
      const owner = stringField(plugin, 'projectPath')

      return scope === 'user' || scope === 'managed' || !owner || projectPaths.includes(owner)
    })
    .map((plugin): InstalledPlugin => {
      const id = stringField(plugin, 'id')

      return {
        id,
        ...splitId(id),
        version: stringField(plugin, 'version'),
        scope: PLUGIN_SCOPES.find((value) => value === stringField(plugin, 'scope')) ?? '',
        enabled: plugin['enabled'] === true,
      }
    })
    .filter((plugin) => plugin.id.length > 0)

/** Каталог маркетплейсов: самые устанавливаемые первыми, описания короче. */
export const availablePlugins = (reply: unknown): AvailablePlugin[] =>
  (isRecord(reply) ? recordsField(reply, 'available') : [])
    .map((plugin) => {
      const id = stringField(plugin, 'pluginId')

      return {
        id,
        name: stringField(plugin, 'name') || splitId(id).name,
        marketplace: stringField(plugin, 'marketplaceName') || splitId(id).marketplace,
        description: stringField(plugin, 'description').slice(0, DESCRIPTION_MAX_CHARS),
        installCount: numberField(plugin, 'installCount'),
      }
    })
    .filter((plugin) => plugin.id.length > 0)
    .sort((left, right) => right.installCount - left.installCount)

/**
 * Маркетплейсы: откуда каждый («github: anthropics/…»). Адрес частного репозитория
 * бывает с логином и токеном - в окно он уходит без них.
 */
export const marketplacesOf = (reply: unknown): Marketplace[] =>
  (Array.isArray(reply) ? reply.filter(isRecord) : [])
    .map((market) => {
      const url = stringField(market, 'url')
      const where = url
        ? maskUrl(url)
        : maskText(stringField(market, 'repo') || stringField(market, 'path'))
      const kind = stringField(market, 'source')

      return {
        name: stringField(market, 'name'),
        source: kind && where ? `${kind}: ${where}` : where,
      }
    })
    .filter((market) => market.name.length > 0)
