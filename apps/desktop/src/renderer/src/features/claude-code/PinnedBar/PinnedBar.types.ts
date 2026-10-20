import type { FeedItem } from '@shared/claude-feed'

import type { PinnedItem } from '../pins.utils'

export type PinnedBarProps = {
  conversationId: string
  /** Лента разговора как есть: полка собирается из того, что в ней стоит сейчас. */
  items: readonly FeedItem[]
  /** Нажали строку: прыжок к самому сообщению. */
  onJump: (itemId: string) => void
  /**
   * Высота полки в пикселях - на каждое её изменение и 0, когда полки нет: лента держит
   * столько запаса сверху, чтобы первые строки не прятались под полкой.
   */
  onHeight?: ((px: number) => void) | undefined
}

export type PinnedRowProps = {
  item: PinnedItem
  onJump: (itemId: string) => void
  onUnpin: (itemId: string) => void
}
