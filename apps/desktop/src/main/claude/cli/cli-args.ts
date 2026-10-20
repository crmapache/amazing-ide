import type { EffortLevel, PermissionMode } from '@shared/claude'
import type { SettingSources } from '@shared/claude-prefs'

import { settingSourcesArg } from '../settings/setting-layers'
import type { CliFeatures } from './cli-features'
import { PANEL_BRIEFING } from './cli.constants'

/** С чем поднять процесс разговора. */
export type LaunchOptions = {
  sessionId: string
  /** Транскрипт сессии уже есть на диске: продолжить её, а не начинать с этим id. */
  resume: boolean
  model: string | null
  effort: EffortLevel | null
  permissionMode: PermissionMode
  /**
   * Форк, который ещё не родился: поднять его от источника (`--fork-session`) до строки
   * `at` под нашим id. Родившийся форк продолжается своим транскриптом.
   */
  fork: { sourceSessionId: string; at: string } | null
  /**
   * Какие слои настроек Claude Code читает проект (Settings sources). Спрашивается на
   * каждом запуске: экран открывают, когда разговоры уже идут, и следующий подъём
   * процесса должен идти так, как только что попросили.
   */
  settingSources: SettingSources
}

/** Флаг слоёв: «все» - флага нет вовсе; CLI, который его не знает, не получает его. */
const sourcesArgs = (sources: SettingSources, features: CliFeatures): string[] => {
  const value = settingSourcesArg(sources)

  return value !== null && features.settingSources ? ['--setting-sources', value] : []
}

/** С чего начать сессию: продолжить, ответвить от источника или начать с нашим id. */
const sessionArgs = (options: LaunchOptions): string[] => {
  if (options.resume) return ['--resume', options.sessionId]
  if (!options.fork) return ['--session-id', options.sessionId]

  return [
    '--resume',
    options.fork.sourceSessionId,
    '--fork-session',
    '--session-id',
    options.sessionId,
    // Скрытый флаг (в --help его нет): форк несёт источник до этой строки включительно.
    '--resume-session-at',
    options.fork.at,
  ]
}

/** Режим для CLI: «спрашивать» в новых версиях называется manual. */
export const cliPermissionMode = (mode: PermissionMode, features: CliFeatures): string =>
  mode === 'default' && features.manualMode ? 'manual' : mode

/**
 * Аргументы CLI для разговора в режиме потока. Поток JSON в обе стороны, частичные
 * сообщения (ответ появляется по буквам), вопросы разрешения - управляющими
 * запросами через stdin/stdout (`--permission-prompt-tool stdio`): без этого флага CLI
 * молча отклоняет всё, что требует разрешения, и выключает AskUserQuestion и
 * ExitPlanMode (ADR 0009). Режим разрешений передаётся всегда: иначе CLI возьмёт свой
 * из настроек человека, и панель показывала бы не тот.
 *
 * В аргументах нет переводов строк и кавычек: значения короткие и проверены на входе,
 * пояснение для модели - одна строка.
 */
export const buildLaunchArgs = (options: LaunchOptions, features: CliFeatures): string[] => [
  '-p',
  '--verbose',
  '--input-format',
  'stream-json',
  '--output-format',
  'stream-json',
  '--include-partial-messages',
  '--permission-prompt-tool',
  'stdio',
  '--append-system-prompt',
  PANEL_BRIEFING,
  ...sessionArgs(options),
  '--permission-mode',
  cliPermissionMode(options.permissionMode, features),
  ...(features.allowSkipPermissions ? ['--allow-dangerously-skip-permissions'] : []),
  ...(options.model ? ['--model', options.model] : []),
  ...(options.effort ? ['--effort', options.effort] : []),
  ...sourcesArgs(options.settingSources, features),
]
