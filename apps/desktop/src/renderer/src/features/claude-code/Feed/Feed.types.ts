import type { Conversation } from '@shared/claude'
import type { FeedItem } from '@shared/claude-feed'

import type { FeedRow } from '../claude.types'

export type FeedProps = {
  conversation: Conversation
  items: readonly FeedItem[]
}

export type FeedRowViewProps = {
  row: FeedRow
}

export type WorkingLineProps = {
  conversation: Conversation
  items: readonly FeedItem[]
}

export type JumpButtonProps = {
  /** Сколько строк пришло, пока лента не у низа. */
  unread: number
  onJump: () => void
}

export type EarlierMarkerProps = {
  onLoad: () => void
  isLoading: boolean
}
