import type { ConfigGroup, ConfigLockLayer, ClaudeConfigSetting } from '@shared/claude-config'

import type { LayerSettings, SettingsLayer } from '../settings/setting-layers'
import { isRecord } from '../settings/setting-layers'

/**
 * Собственные настройки Claude Code - то, что в терминале меняет `/config`. В режиме
 * потока та же команда печатает справку: ключ каждой настройки и её варианты. Экран
 * строится из слов самого CLI, и пишет тоже CLI (`/config ключ=значение`): его
 * проверки, его файлы, его отказы. Текущее значение CLI в этом режиме не говорит -
 * оно читается из его файлов по его же правилам (таблица SPECS снята в ACC со сборщика
 * экрана CLI 2.1.280).
 */

/** Строка справки: ключ и варианты, или любое значение (`<value>`). */
export type ConfigEntry = { key: string; options: string[]; free: boolean }

/**
 * Где CLI держит настройку. global - бывший глобальный конфиг: сначала settings.json
 * человека, потом старый `.claude.json`, потом умолчание CLI. settings - обычная
 * настройка, по слоям проекта сильнейшим первым.
 */
type ConfigStore = 'global' | 'settings'

type ConfigSpec = {
  store: ConfigStore
  path: readonly string[]
  /** Значение, когда ничего не записано; null - CLI считает его на ходу, угадывать нельзя. */
  fallback: string | null
  group: ConfigGroup
  /** Куда пишет `/config`: слой сильнее этого, держащий настройку, правку перебьёт. */
  writes: SettingsLayer
  read: (value: unknown) => string | null
  /** Выключатель рядом, который гасит настройку, что бы она ни говорила сама. */
  offWhen?: readonly string[]
}

/** Файлы настроек, уже прочитанные: тест отдаёт их напрямую, без диска. */
export type ConfigFiles = {
  /** Слои, которые проект читает, - сильнейший первым. */
  layers: readonly LayerSettings[]
  /** `.claude.json` - старый глобальный конфиг CLI, всё ещё читается для непереписанного. */
  globalConfig: Record<string, unknown>
}

/** Значение так, как его пишет `/config`: строки, булевы и числа - текстом, прочее - нет. */
const scalar = (value: unknown): string | null =>
  typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number'
    ? String(value)
    : null

const global = (key: string, fallback: string | null, group: ConfigGroup): ConfigSpec => ({
  store: 'global',
  path: [key],
  fallback,
  group,
  writes: 'user',
  read: scalar,
})

const setting = (key: string, fallback: string | null, group: ConfigGroup): ConfigSpec => ({
  store: 'settings',
  path: [key],
  fallback,
  group,
  writes: 'user',
  read: scalar,
})

/**
 * Настройка, которую `/config` пишет в локальный файл проекта, а не человеку (замерено:
 * `tips=false` лёг в `.claude/settings.local.json`). Действует только в этом проекте.
 */
const local = (key: string, fallback: string | null, group: ConfigGroup): ConfigSpec => ({
  ...setting(key, fallback, group),
  writes: 'local',
})

const switchModels = (value: unknown): string | null => {
  if (value === true) return 'Switch automatically'
  if (value === false) return 'Ask each time'

  return null
}

/** Копии файлов для отката кода: её читает и экран, и запуск процесса (checkpointsOn). */
const CHECKPOINTS = global('fileCheckpointingEnabled', 'true', 'work')

/**
 * Настройки, которые экран умеет прочесть, по ключу `/config`. Порядок - по важности:
 * сначала то, что меняет работу разговоров, потом то, что рисует только терминал.
 * Модель и режим - тоже в терминальной группе: в панели их решают чипы под полем.
 */
const SPECS: Readonly<Record<string, ConfigSpec>> = {
  autoCompact: global('autoCompactEnabled', 'true', 'work'),
  checkpoints: CHECKPOINTS,
  thinking: setting('alwaysThinkingEnabled', 'true', 'work'),
  language: setting('language', 'default', 'work'),
  outputStyle: local('outputStyle', 'default', 'work'),
  workflows: { ...setting('enableWorkflows', null, 'work'), offWhen: ['disableWorkflows'] },
  workflowKeywordTriggerEnabled: setting('workflowKeywordTriggerEnabled', 'true', 'work'),
  workflowSizeGuideline: setting('workflowSizeGuideline', null, 'work'),
  useAutoModeDuringPlan: setting('useAutoModeDuringPlan', 'true', 'work'),
  worktreeBaseRef: { ...setting('worktree', 'fresh', 'work'), path: ['worktree', 'baseRef'] },
  switchModelsOnFlag: { ...setting('switchModelsOnFlag', null, 'work'), read: switchModels },
  chrome: global('claudeInChromeDefaultEnabled', 'false', 'work'),
  remoteControl: global('remoteControlAtStartup', 'default', 'work'),
  inputNeededNotifEnabled: global('inputNeededNotifEnabled', 'false', 'work'),
  agentPushNotifEnabled: global('agentPushNotifEnabled', 'false', 'work'),
  model: setting('model', 'default', 'terminal'),
  permissionMode: {
    ...setting('permissions', 'default', 'terminal'),
    path: ['permissions', 'defaultMode'],
  },
  theme: global('theme', 'dark', 'terminal'),
  // Старый режим «emacs» CLI теперь зовёт «normal».
  editor: {
    ...global('editorMode', 'normal', 'terminal'),
    read: (value) => (scalar(value) === 'emacs' ? 'normal' : scalar(value)),
  },
  verbose: global('verbose', 'false', 'terminal'),
  tips: local('spinnerTipsEnabled', 'true', 'terminal'),
  reduceMotion: local('prefersReducedMotion', 'false', 'terminal'),
  promptSuggestionEnabled: setting('promptSuggestionEnabled', null, 'terminal'),
  recap: setting('awaySummaryEnabled', null, 'terminal'),
  timeFormat: setting('timeFormat', 'auto', 'terminal'),
  turnDuration: global('showTurnDuration', 'true', 'terminal'),
  progressBar: global('terminalProgressBarEnabled', 'true', 'terminal'),
  notifChannel: global('preferredNotifChannel', 'auto', 'terminal'),
  autoScroll: global('autoScrollEnabled', 'true', 'terminal'),
  copyFullResponse: global('copyFullResponse', 'false', 'terminal'),
  copyOnSelect: global('copyOnSelect', 'true', 'terminal'),
  gitignore: global('respectGitignore', 'true', 'terminal'),
  defaultToAgentsView: global('defaultToAgentsView', 'false', 'terminal'),
  leftArrowOpensAgents: global('leftArrowOpensAgents', 'true', 'terminal'),
  externalEditorContext: global('externalEditorContext', 'false', 'terminal'),
  prStatus: global('prStatusFooterEnabled', 'true', 'terminal'),
  autoInstallIdeExtension: global('autoInstallIdeExtension', 'true', 'terminal'),
}

const SPEC_ORDER = new Map(Object.keys(SPECS).map((key, index) => [key, index]))

/** Слои от сильного к слабому: меньший номер перебивает больший. */
const LAYER_RANK: Readonly<Record<SettingsLayer, number>> = {
  policy: 0,
  local: 1,
  project: 2,
  user: 3,
}

const ENTRY = /^([A-Za-z][A-Za-z0-9_]*)=(.+)$/

/**
 * Справка `/config` - строками «ключ=вариант|вариант». Строки другого вида (шапка
 * «Usage: …») пропускаются; пустой список - CLI сказал что-то совсем другое, и экран
 * так и скажет, а не покажет пустоту.
 */
export const parseConfigHelp = (text: string): ConfigEntry[] => {
  const entries = new Map<string, ConfigEntry>()

  for (const line of text.split('\n')) {
    const match = ENTRY.exec(line.trim())
    const key = match?.[1]
    const values = match?.[2]?.trim()

    if (!key || !values || entries.has(key)) continue

    const free = values.startsWith('<') && values.endsWith('>')
    const options = free
      ? []
      : values
          .split('|')
          .map((option) => option.trim())
          .filter(Boolean)

    entries.set(key, { key, options, free })
  }

  return [...entries.values()]
}

const at = (root: Record<string, unknown>, path: readonly string[]): unknown => {
  let current: unknown = root

  for (const name of path) current = isRecord(current) ? current[name] : undefined

  return current ?? undefined
}

/** Действующее значение и слой, откуда оно; слоя нет - умолчание или старый конфиг. */
const valueOf = (
  spec: ConfigSpec,
  files: ConfigFiles,
): { value: string | null; layer: SettingsLayer | null } => {
  // Глобальная - только человека: политика может её держать, файлы проекта - нет.
  const layers =
    spec.store === 'global'
      ? files.layers.filter(({ layer }) => layer === 'policy' || layer === 'user')
      : files.layers
  const offWhen = spec.offWhen
  const off = offWhen && layers.find(({ settings }) => at(settings, offWhen) === true)

  if (off) return { value: 'false', layer: off.layer }

  for (const { layer, settings } of layers) {
    const stored = at(settings, spec.path)

    if (stored !== undefined) return { value: spec.read(stored), layer }
  }

  const old = spec.store === 'global' ? at(files.globalConfig, spec.path) : undefined

  return { value: old === undefined ? spec.fallback : spec.read(old), layer: null }
}

/** Слой сильнее того, куда пишет `/config`, - правка там ничего не изменит. */
const lockOf = (layer: SettingsLayer | null, writes: SettingsLayer): ConfigLockLayer | null =>
  layer && layer !== 'user' && LAYER_RANK[layer] < LAYER_RANK[writes] ? layer : null

/**
 * Список экрана с действующими значениями: по важности (порядок SPECS), незнакомые
 * новому экрану - после, в порядке CLI, в группе «прочее» и без значения: неизвестное
 * лучше угаданного.
 */
export const configSettings = (
  entries: readonly ConfigEntry[],
  files: ConfigFiles,
): ClaudeConfigSetting[] =>
  [...entries]
    .sort(
      (a, b) =>
        (SPEC_ORDER.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (SPEC_ORDER.get(b.key) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((entry) => {
      const spec = SPECS[entry.key]

      if (!spec)
        return { ...entry, value: null, group: 'other', lockedBy: null, projectOnly: false }

      const { value, layer } = valueOf(spec, files)

      return {
        ...entry,
        value,
        group: spec.group,
        lockedBy: lockOf(layer, spec.writes),
        projectOnly: spec.writes === 'local',
      }
    })

/**
 * Строка для `/config`, меняющая одну настройку, или null - это не правка. Только ключ
 * из справки и только его вариант (или любое значение одной строкой у свободного):
 * команда уходит в процесс на этой машине, и что в неё попадёт, решается здесь.
 */
export const configCommand = (
  entries: readonly ConfigEntry[],
  key: string,
  value: string,
): string | null => {
  const entry = entries.find((item) => item.key === key)
  const line = value.replace(/[\r\n]+/g, ' ').trim()

  if (!entry || !line) return null
  if (!entry.free && !entry.options.includes(line)) return null

  return `/config ${key}=${line}`
}

/**
 * Принята ли правка - по файлу, а не по фразе CLI. Настройку, которую экран не умеет
 * прочесть, проверить нечем - верим. Свободное значение CLI пишет по-своему («ja» ложится
 * «Japanese»): там достаточно, что оно поменялось.
 */
export const isChangeTaken = (change: {
  asked: string
  before: string | null
  after: string | null
  free: boolean
}): boolean => {
  if (change.after === null) return true
  if (change.after.toLowerCase() === change.asked.trim().toLowerCase()) return true

  return change.free && change.after !== change.before
}

/**
 * Держит ли CLI копии файлов (настройка `checkpoints`, по умолчанию да). Без них откат
 * кода к сообщению невозможен, и панель говорит «выключено», а не «не вышло» (как в ACC).
 */
export const checkpointsOn = (files: ConfigFiles): boolean =>
  valueOf(CHECKPOINTS, files).value !== 'false'
