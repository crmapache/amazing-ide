import { useRef } from 'react'

import type { ClaudeState } from '@shared/claude'
import type { SoundEvent } from '@shared/claude-prefs'
import type { WorkspaceState } from '@shared/workspace'
import { useQueryClient } from '@tanstack/react-query'

import { useIpcEvent } from '../../lib/ipc.hooks'
import { useLayoutStore } from '../../state/layout.store'
import { QUERY_KEYS } from '../../state/query-keys'
import { SOUND_FILES } from './sounds.constants'
import type { LastSound } from './sounds.utils'
import { volumeOf, isWatched, passesGap, soundRank } from './sounds.utils'

/**
 * Сыграть звук повода. Громкость в процентах - доля амплитуды, как в ACC (там - усиление
 * в децибелах, 20·log10 доли): половина процентов - «чуть тише», а не «вдвое тише».
 * Автозапуск звука Electron разрешает без жеста. Не сыграл (нет устройства) - звук не
 * стоит того, чтобы ронять панель.
 */
export const playSound = (event: SoundEvent, volume: number): void => {
  if (volume <= 0) return

  const audio = new Audio(SOUND_FILES[event])

  audio.volume = Math.min(1, volume / 100)
  audio.play().catch((error: unknown) => console.warn('[claude-code] звук не сыграл:', error))
}

/**
 * Звук, когда разговор позвал человека (событие claude:call). Решает главный процесс -
 * какой повод и звать ли вовсе (выключенные галочкой не приходят); окно - «оболочка»:
 * играет с громкостью из настроек, молчит, если человек и так смотрит на эту вкладку,
 * и из звуков подряд пропускает только более важный. Подписка одна на окно.
 */
export const useCallSounds = () => {
  const queryClient = useQueryClient()
  const last = useRef<LastSound | null>(null)

  useIpcEvent('claude:call', (call) => {
    const state = queryClient.getQueryData<ClaudeState>(QUERY_KEYS.claudeState)
    const workspace = queryClient.getQueryData<WorkspaceState>(QUERY_KEYS.workspace)
    const project = workspace?.projects.find((item) => item.id === workspace.activeProjectId)
    const { provider } = useLayoutStore.getState()
    const now = Date.now()
    const view = {
      activeConversationId: (project && state?.activeByProject[project.rootPath]) ?? null,
      panelShown: provider.isOpen && provider.activeViewId === 'claude-code',
      windowFocused: document.hasFocus() && document.visibilityState === 'visible',
    }

    if (!state || isWatched(call, view) || !passesGap(last.current, call.reason, now)) return

    last.current = { at: now, rank: soundRank(call.reason) }
    playSound(call.reason, volumeOf(state.prefs, call.reason))
  })
}
