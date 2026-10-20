import type { Conversation } from '@shared/claude'

import { useProjectClaudeSettings } from './claude-settings.queries'
import { useRefusedModes } from './claude.queries'
import type { ModeAvailability } from './pane-keys.utils'
import { modeAvailability } from './pane-keys.utils'

/**
 * Какие режимы разговору доступны: запрет bypass из слоёв настроек проекта и отказы CLI,
 * которые помнит главный процесс. Одно правило для Shift+Tab и меню MODE.
 */
export const useModeAvailability = (
  projectId: string | undefined,
  conversation: Conversation | null,
): ModeAvailability => {
  const { data: settings } = useProjectClaudeSettings(projectId ?? '', projectId !== undefined)
  const refused = useRefusedModes()

  return modeAvailability(refused, settings?.bypassDisabled, conversation)
}
