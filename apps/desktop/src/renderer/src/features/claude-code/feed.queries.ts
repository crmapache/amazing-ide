import { useState, useCallback } from 'react'

import type { ConversationFeed } from '@shared/claude-feed'
import { useQueryClient } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'

/**
 * Страница ранней истории («load earlier messages»): главный процесс ставит сообщения
 * выше загруженного и отвечает лентой целиком - она ложится в кэш. pages - сколько
 * страниц уже пришло: по нему лента держит место чтения.
 */
export const useLoadEarlier = (conversationId: string) => {
  const queryClient = useQueryClient()
  const [pages, setPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadEarlier = useCallback(() => {
    if (isLoading) return

    setIsLoading(true)
    invoke('claude:loadEarlier', { conversationId })
      .then((feed) => {
        queryClient.setQueryData<ConversationFeed>(QUERY_KEYS.claudeFeed(conversationId), feed)
        setPages((count) => count + 1)
      })
      .catch((error: unknown) => console.warn('[claude-code] ранние сообщения не пришли:', error))
      .finally(() => setIsLoading(false))
  }, [conversationId, isLoading, queryClient])

  return { pages, isLoading, loadEarlier }
}
