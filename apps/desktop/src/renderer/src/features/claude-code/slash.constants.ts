import type { PanelCommandId } from './slash.types'

/** Подсказка листается сама; потолок - от бесконечного списка, а не от полного. */
export const MAX_SUGGESTIONS = 50

/**
 * Команды панели по порядку ACC. В подсказке видна только та, у которой есть действие
 * в IDE (`usePanelCommands`): обещать команду, которая ничего не сделает, нельзя.
 */
export const PANEL_COMMANDS: readonly PanelCommandId[] = [
  'resume',
  'fork',
  'login',
  'logout',
  'design-login',
  'rename',
  'config',
  'btw',
  'fast',
  'status',
]

/** Синтаксис аргумента команд панели - серым в поле после имени. */
export const PANEL_ARGUMENTS: Partial<Record<PanelCommandId, string>> = {
  rename: '[new name]',
  btw: '<question>',
  fast: '[on|off]',
}

/** Встроенные команды CLI, описанные заранее: видны и до первого хода. */
export const BUILTIN_COMMANDS = [
  'model',
  'effort',
  'context',
  'cost',
  'usage',
  'code-review',
] as const

export type BuiltinCommandId = (typeof BUILTIN_COMMANDS)[number]

/** Синтаксис встроенных команд, где он есть (code-review - сверено с бинарником в ACC). */
export const BUILTIN_ARGUMENTS: Partial<Record<BuiltinCommandId, string>> = {
  'code-review': '[low|medium|high|xhigh|max|ultra] [--fix] [--comment] [<target>]',
}

/**
 * Команды, которые CLI в режиме потока не выполняет, а честно отказывает: показывать их
 * в подсказке - обещать отказ.
 */
export const UNAVAILABLE_IN_STREAM: ReadonlySet<string> = new Set([
  'export',
  'permissions',
  'status',
])

/** Значение «как в настройках CLI» у /model и /effort. */
export const DEFAULT_ARGUMENT = 'default'
