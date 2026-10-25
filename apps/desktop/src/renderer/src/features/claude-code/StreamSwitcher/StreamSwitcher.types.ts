import type { Conversation } from '@shared/claude'
import type { FeedItem, ToolFeedItem } from '@shared/claude-feed'

export type StreamSwitcherProps = {
  conversation: Conversation
  items: readonly FeedItem[]
}

/** Что останавливают: задачу CLI, её вид (агент или команда) и о чём она - для вопроса. */
export type StopTarget = { taskId: string; kind: 'agent' | 'command'; subject: string }

export type AgentChipProps = {
  tool: ToolFeedItem
  isActive: boolean
  onPick: (itemId: string) => void
  onStop: (target: StopTarget) => void
}

export type CommandChipProps = {
  tool: ToolFeedItem
  onStop: (target: StopTarget) => void
}

export type CommandViewProps = {
  command: string
  /** Зачем команда - слова модели из вызова; пусто - строки нет. */
  description: string
  /** С какого момента идёт (мс); 0 - не известно, времени не будет. */
  startedAt: number
  /** Остановить - тем же вопросом, что крестик чипа; null - CLI не назвал задачу. */
  onStop: (() => void) | null
}

export type StopTaskDialogProps = {
  conversationId: string
  target: StopTarget
  onClose: () => void
}

export type ChipClockProps = {
  /** С какого момента считать (мс); 0 - не известно, времени не будет. */
  startedAt: number
}
