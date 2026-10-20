import { EFFORT_LEVELS, PERMISSION_MODES } from '@shared/claude'
import type { PanelPrefs, SoundEvent, PanelPrefsPatch } from '@shared/claude-prefs'
import {
  SEND_KEYS,
  SOUND_EVENTS,
  INDICATOR_IDS,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  SETTING_SOURCES,
  COMPOSER_LAYOUTS,
  GAUGE_VIVID_CALM,
  GAUGE_VIVID_FULL,
  TEXT_SIZE_FOLLOW,
  MODEL_NAME_PATTERN,
  DEFAULT_PANEL_PREFS,
} from '@shared/claude-prefs'

/** Своих моделей не больше тридцати: это список для меню, а не каталог. */
const MAX_CUSTOM_MODELS = 30

const MAX_PASTE_LINES = 1000

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | undefined =>
  options.find((option) => option === value)

const clamp = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : undefined

/**
 * Имя модели, пригодное для аргумента запуска, или undefined. С дефиса - нет: CLI
 * прочёл бы его флагом, а не значением `--model`.
 */
export const usableModel = (value: unknown): string | undefined => {
  const name = typeof value === 'string' ? value.trim() : ''

  return MODEL_NAME_PATTERN.test(name) && !name.startsWith('-') ? name : undefined
}

const subset = <T extends string>(value: unknown, options: readonly T[]): T[] | undefined =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is T => options.includes(item as T)))]
    : undefined

const volumes = (value: unknown): Partial<Record<SoundEvent, number>> | undefined => {
  if (typeof value !== 'object' || value === null) return undefined

  const entries = Object.entries(record(value)).flatMap(([event, volume]) => {
    const known = oneOf(event, SOUND_EVENTS)
    const level = clamp(volume, 0, 100)

    return known && level !== undefined ? [[known, level] as const] : []
  })

  return Object.fromEntries(entries)
}

const sources = (value: unknown): PanelPrefs['settingSources'] | undefined => {
  if (typeof value !== 'object' || value === null) return undefined

  return Object.fromEntries(
    Object.entries(record(value)).flatMap(([path, choice]) => {
      const known = oneOf(choice, SETTING_SOURCES)

      // По умолчанию all - его не храним, чтобы файл не рос записями «как было».
      return path.startsWith('/') && known && known !== 'all' ? [[path, known] as const] : []
    }),
  )
}

const textSize = (value: unknown): number | undefined => {
  if (value === TEXT_SIZE_FOLLOW) return TEXT_SIZE_FOLLOW

  return clamp(value, TEXT_SIZE_MIN, TEXT_SIZE_MAX)
}

/**
 * Путь к CLI: пусто или абсолютный путь без переводов строк. Что это правда Claude Code,
 * проверяет поиск CLI на каждом запуске (cli/cli-path.ts), а не разбор настроек.
 */
const cliPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const path = value.trim()

  return path === '' || (path.startsWith('/') && !/[\n\r\0]/.test(path) && path.length < 1024)
    ? path
    : undefined
}

/** Поле «как в последней вкладке» (null) или значение из списка. */
const pinned = <T extends string>(value: unknown, options: readonly T[]): T | null | undefined =>
  value === null ? null : oneOf(value, options)

/**
 * Только то, что в записи узнаваемо: чужое и битое отбрасывается поле за полем, а не
 * роняет все настройки разом.
 */
const parseFields = (value: unknown): PanelPrefsPatch => {
  const input = record(value)
  const fields: { [Key in keyof PanelPrefs]: PanelPrefs[Key] | undefined } = {
    newTabModel: input['newTabModel'] === null ? null : usableModel(input['newTabModel']),
    newTabEffort: pinned(input['newTabEffort'], EFFORT_LEVELS),
    newTabMode: pinned(input['newTabMode'], PERMISSION_MODES),
    composerLayout: oneOf(input['composerLayout'], COMPOSER_LAYOUTS),
    pasteCollapse: clamp(input['pasteCollapse'], 0, MAX_PASTE_LINES),
    sendKey: oneOf(input['sendKey'], SEND_KEYS),
    gaugeVivid: clamp(input['gaugeVivid'], GAUGE_VIVID_CALM, GAUGE_VIVID_FULL),
    hiddenIndicators: subset(input['hiddenIndicators'], INDICATOR_IDS),
    textSize: textSize(input['textSize']),
    restoreTabs: typeof input['restoreTabs'] === 'boolean' ? input['restoreTabs'] : undefined,
    shareEditor: typeof input['shareEditor'] === 'boolean' ? input['shareEditor'] : undefined,
    spellcheck: typeof input['spellcheck'] === 'boolean' ? input['spellcheck'] : undefined,
    customModels: Array.isArray(input['customModels'])
      ? [
          ...new Set(input['customModels'].map(usableModel).filter((name) => name !== undefined)),
        ].slice(0, MAX_CUSTOM_MODELS)
      : undefined,
    mutedSounds: subset(input['mutedSounds'], SOUND_EVENTS),
    soundVolumes: volumes(input['soundVolumes']),
    settingSources: sources(input['settingSources']),
    cliPath: cliPath(input['cliPath']),
  }

  return Object.fromEntries(Object.entries(fields).filter(([, field]) => field !== undefined))
}

/** Настройки с диска: чего нет или что не разобралось - по умолчанию. */
export const parsePanelPrefs = (value: unknown): PanelPrefs => ({
  ...DEFAULT_PANEL_PREFS,
  ...parseFields(value),
})

/**
 * Изменение из окна поверх текущих. Названное, но негодное поле - ошибка, а не тихий
 * пропуск: окно не должно думать, что настройка встала.
 */
export const applyPrefsPatch = (prefs: PanelPrefs, patch: unknown): PanelPrefs => {
  const named = Object.keys(record(patch))
  const parsed = parseFields(patch)
  const rejected = named.filter((key) => !(key in parsed))

  if (rejected.length > 0) throw new Error(`Недопустимые настройки: ${rejected.join(', ')}`)

  const next = { ...prefs, ...parsed }
  const removed = prefs.customModels.filter((model) => !next.customModels.includes(model))

  // Удалённая своя модель снимается и с новых вкладок: иначе каждая новая вкладка
  // стартовала бы на имени, которого в меню больше нет.
  return next.newTabModel !== null && removed.includes(next.newTabModel)
    ? { ...next, newTabModel: null }
    : next
}

/**
 * Папки проектов, у которых сменились источники настроек: их процессы перезапускаются,
 * как освободятся, - CLI читает слои только на старте.
 */
export const changedSourceProjects = (
  before: PanelPrefs['settingSources'],
  after: PanelPrefs['settingSources'],
): string[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (path) => (before[path] ?? 'all') !== (after[path] ?? 'all'),
  )
