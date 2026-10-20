import { randomUUID } from 'node:crypto'

import type { ForkOrigin, Conversation } from '@shared/claude'
import type { PanelPrefs } from '@shared/claude-prefs'

import { freshConversation } from '../claude-state'
import { claudeHome } from '../history/transcript-paths'
import type { TranscriptSummary } from '../history/transcript-summary'
import { defaultPermissionMode } from '../settings/default-mode'

/** Из чего рождается вкладка: разговор, имя из транскрипта и на кого она похожа. */
export type NewTab = {
  projectPath: string
  sessionId: string
  /** Имя прошлого разговора с его рангом; null - новый разговор, имени ещё нет. */
  name: TranscriptSummary
  /** Источник форка: форк встаёт в его группу на ступень глубже и продолжает его настройки. */
  base?: Conversation | undefined
  fork: ForkOrigin | null
  /** Выбранная вкладка проекта: новая наследует её модель, усилие и режим. */
  current: Conversation | undefined
  prefs: PanelPrefs
}

/**
 * Новая вкладка разговора. Модель, усилие и режим - закреплённые в Settings → New chats,
 * иначе как у выбранной вкладки проекта; форк продолжает свой источник, и закреплённое
 * его не перебивает.
 */
export const newTabConversation = async (tab: NewTab): Promise<Conversation> => {
  const { projectPath, base, name } = tab
  const current = base ?? tab.current
  const pinned = base ? null : tab.prefs
  const id = randomUUID()
  const permissionMode =
    pinned?.newTabMode ??
    current?.permissionMode ??
    // Из тех слоёв настроек, с которыми процесс поднимется (Settings sources).
    (await defaultPermissionMode(
      projectPath,
      await claudeHome(),
      tab.prefs.settingSources[projectPath],
    ))

  return freshConversation({
    id,
    projectPath,
    sessionId: tab.sessionId,
    title: name?.title ?? '',
    titleSource: name?.source ?? 'default',
    groupId: base?.groupId ?? id,
    depth: base ? base.depth + 1 : 0,
    model: pinned?.newTabModel ?? current?.model ?? null,
    effort: pinned?.newTabEffort ?? current?.effort ?? null,
    permissionMode,
    queue: [],
    fork: tab.fork,
    updatedAt: Date.now(),
    // Быстрый режим платный: новая вкладка без него, форк продолжает свой источник.
    ...(base?.fastMode && { fastMode: true }),
  })
}
