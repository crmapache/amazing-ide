import type { TFunction } from 'i18next'

import type { Conversation } from '@shared/claude'
import type { FeedItem, RetryReason } from '@shared/claude-feed'

import { pendingAgents } from '../agents.utils'
import { formatDuration } from '../claude.utils'
import { RETRY_REASON_KEYS } from '../NoticeRow/NoticeRow.constants'

/** Что сейчас происходит - последняя строка ленты (как streamStatus в ACC). */
export type StreamStatus =
  | { kind: 'none' }
  | { kind: 'stopping'; since: number }
  | { kind: 'waiting' }
  | { kind: 'retry'; reason: RetryReason; retryAt: number }
  | { kind: 'compacting' }
  | { kind: 'agents'; count: number }
  | { kind: 'thinking'; startedAt: number; pausedMs: number }

/**
 * Строка статуса по разговору и ленте. Порядок важен: «останавливаю» старше всего, вопрос
 * человеку старше работы, повтор и компакт - то единственное, что сейчас идёт, а когда
 * хода нет, но работают фоновые агенты, - ждём их. Время - всего запроса (часы работы),
 * а не последнего хода.
 */
export const streamStatus = (
  conversation: Conversation,
  items: readonly FeedItem[],
): StreamStatus => {
  if (conversation.stopRequestedAt !== null) {
    return { kind: 'stopping', since: conversation.stopRequestedAt }
  }

  if (conversation.status === 'waiting') return { kind: 'waiting' }

  const live = items.findLast((item) => item.kind === 'retry' || item.kind === 'compact')

  if (live?.kind === 'retry' && live.pending) {
    return { kind: 'retry', reason: live.reason, retryAt: live.retryAt }
  }

  if (live?.kind === 'compact' && live.pending) return { kind: 'compacting' }

  if (conversation.status === 'running') {
    return {
      kind: 'thinking',
      startedAt: conversation.workStartedAt ?? conversation.turnStartedAt ?? 0,
      pausedMs: conversation.workStartedAt === null ? 0 : conversation.workPausedMs,
    }
  }

  const agents = pendingAgents(items)

  return agents > 0 ? { kind: 'agents', count: agents } : { kind: 'none' }
}

/**
 * Строка ленты у верхней кромки - делением пополам (строки стоят по порядку, а прокрутка
 * приходит десятками в секунду). bottomOf - низ строки по номеру; ответ - первая строка,
 * чей низ ниже кромки.
 */
export const rowAtEdge = (
  count: number,
  bottomOf: (index: number) => number,
  edge: number,
): number => {
  let low = 0
  let high = count - 1
  let found = count - 1

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)

    if (bottomOf(middle) > edge) {
      found = middle
      high = middle - 1
    } else {
      low = middle + 1
    }
  }

  return Math.max(0, found)
}

/** Строка статуса словами; now - для часов работы и отсчёта до повтора. */
export const statusLabel = (t: TFunction, status: StreamStatus, now: number): string => {
  switch (status.kind) {
    case 'stopping':
      return t('claudeCode.stream.stopping')
    case 'waiting':
      return t('claudeCode.stream.waitingForYou')
    case 'compacting':
      return t('claudeCode.stream.compacting')
    case 'agents':
      return status.count === 1
        ? t('claudeCode.stream.waitingForSubagent')
        : t('claudeCode.stream.waitingForSubagents', { count: status.count })
    case 'retry':
      return t('claudeCode.stream.retryWaiting', {
        label: t(RETRY_REASON_KEYS[status.reason]),
        waited: formatDuration(Math.max(0, status.retryAt - now)),
      })
    case 'thinking':
      return status.startedAt
        ? t('claudeCode.stream.withElapsed', {
            label: t('claudeCode.stream.thinking'),
            elapsed: formatDuration(now - status.startedAt - status.pausedMs),
          })
        : t('claudeCode.stream.thinking')
    default:
      return ''
  }
}
