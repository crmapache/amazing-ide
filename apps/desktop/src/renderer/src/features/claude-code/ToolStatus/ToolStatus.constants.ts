import type { ParseKeys } from 'i18next'

import type { ClosedReason } from '@shared/claude-feed'

/** Итог закрытого без результата вызова в шапке - по причине (как closedMeta в ACC). */
export const CLOSED_META_KEYS: Record<ClosedReason, ParseKeys> = {
  replay: 'claudeCode.feed.tool.closedMeta.replay',
  exited: 'claudeCode.feed.tool.closedMeta.exited',
  stopped: 'claudeCode.feed.tool.closedMeta.stopped',
  turnEnded: 'claudeCode.feed.tool.closedMeta.turnEnded',
  untracked: 'claudeCode.feed.tool.closedMeta.untracked',
  restarted: 'claudeCode.feed.tool.closedMeta.restarted',
}

/** Почему вызов закрыт без результата - строкой в раскрытой карточке. */
export const CLOSED_KEYS: Record<ClosedReason, ParseKeys> = {
  replay: 'claudeCode.feed.tool.closed.replay',
  exited: 'claudeCode.feed.tool.closed.exited',
  stopped: 'claudeCode.feed.tool.closed.stopped',
  turnEnded: 'claudeCode.feed.tool.closed.turnEnded',
  untracked: 'claudeCode.feed.tool.closed.untracked',
  restarted: 'claudeCode.feed.tool.closed.restarted',
}
