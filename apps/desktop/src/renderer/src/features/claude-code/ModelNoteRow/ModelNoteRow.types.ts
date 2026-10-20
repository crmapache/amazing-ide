import type { NoticeFeedItem } from '@shared/claude-feed'

export type ModelNoteRowProps = {
  /** Отметка model-stuck или model-swap: detail - первая модель, subject - вторая. */
  item: NoticeFeedItem
}
