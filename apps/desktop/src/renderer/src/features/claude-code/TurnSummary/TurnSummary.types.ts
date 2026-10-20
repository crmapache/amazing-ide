import type { TurnFeedItem } from '@shared/claude-feed'

export type TurnSummaryProps = {
  item: TurnFeedItem
}

/** Чем кончился ход: доработал, остановил человек, прервала панель ради переезда на аккаунт. */
export type TurnEnd = 'worked' | 'stopped' | 'movedAccount'
