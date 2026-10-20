/** Возможности конкретной версии CLI, которые меняют аргументы запуска. */
export type CliFeatures = {
  /**
   * Режим «спрашивать» называется `manual`. В старых версиях он звался `default`; новые
   * `default` ещё понимают, но в справке его уже нет.
   */
  manualMode: boolean
  /**
   * Есть `--allow-dangerously-skip-permissions`: без него CLI не примет переход в
   * bypassPermissions посреди разговора (после одобрения плана, из меню режима).
   */
  allowSkipPermissions: boolean
  /** Есть `--safe-mode`: служебный процесс без хуков, плагинов и MCP человека. */
  safeMode: boolean
  /**
   * Есть `--setting-sources` (Settings sources). Старый CLI неизвестный флаг не
   * пропускает - он просто не стартует, поэтому без него флаг не передаётся.
   */
  settingSources: boolean
}

/** Разбор `claude --help`. Пустая справка (CLI не ответил) - самые осторожные значения. */
export const parseCliFeatures = (help: string): CliFeatures => ({
  manualMode: /"manual"/.test(help),
  allowSkipPermissions: help.includes('--allow-dangerously-skip-permissions'),
  safeMode: help.includes('--safe-mode'),
  settingSources: help.includes('--setting-sources'),
})
