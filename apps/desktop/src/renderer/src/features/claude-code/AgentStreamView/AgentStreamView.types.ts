import type { Conversation } from '@shared/claude'
import type { FeedItem } from '@shared/claude-feed'

export type AgentStreamViewProps = {
  conversation: Conversation
  items: readonly FeedItem[]
}

export type AgentStreamProps = {
  itemId: string
  items: readonly FeedItem[]
}
