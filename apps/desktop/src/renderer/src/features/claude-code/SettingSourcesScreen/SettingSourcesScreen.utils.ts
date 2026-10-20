import type { PanelPrefs, SettingSources } from '@shared/claude-prefs'

/**
 * Источники всех проектов с новым выбором этого. «Все» не хранится: «как Claude Code
 * делает сам» и «экран не открывали» - один ответ, и на диске они выглядят одинаково.
 */
export const withSources = (
  all: PanelPrefs['settingSources'],
  projectPath: string,
  choice: SettingSources,
): PanelPrefs['settingSources'] => {
  const { [projectPath]: _previous, ...rest } = all

  return choice === 'all' ? rest : { ...rest, [projectPath]: choice }
}
