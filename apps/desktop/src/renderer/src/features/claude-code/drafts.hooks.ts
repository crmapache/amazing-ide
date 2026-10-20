import { useRef, useEffect } from 'react'

import type { ClaudeState } from '@shared/claude'
import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../../state/query-keys'
import { useComposerStore } from './composer.store'

/**
 * Выключено «Tabs on start» (Settings): вкладки прошлой сессии главный процесс не
 * поднял - и черновики к ним стираются, по первому состоянию за запуск окна. Черновики
 * живых вкладок остаются: перезагрузка окна - не перезапуск IDE.
 */
export const useForgetDraftsOnStart = () => {
  const { data: state } = useQuery<ClaudeState>({
    queryKey: QUERY_KEYS.claudeState,
    enabled: false,
  })
  const done = useRef(false)

  useEffect(() => {
    if (!state || done.current) return

    done.current = true

    if (state.prefs.restoreTabs) return

    const live = new Set(state.conversations.map((conversation) => conversation.id))

    useComposerStore.setState((store) => ({
      drafts: Object.fromEntries(Object.entries(store.drafts).filter(([key]) => live.has(key))),
    }))
  }, [state])
}
