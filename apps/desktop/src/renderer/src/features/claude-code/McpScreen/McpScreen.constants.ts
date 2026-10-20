import type { ParseKeys } from 'i18next'

import type { McpScope, McpStatus } from '@shared/claude-tools'

import type { BadgeTone } from '@amazing-ide/ui/Badge.types'

/** Группы в порядке терминального /mcp: проект, локальные, свои, claude.ai, организации, встроенные. */
export const SCOPE_ORDER: readonly McpScope[] = [
  'project',
  'local',
  'user',
  'claudeai',
  'managed',
  'dynamic',
  'other',
]

export const SCOPE_KEYS: Record<McpScope, ParseKeys> = {
  project: 'claudeCode.mcp.scopes.project',
  local: 'claudeCode.mcp.scopes.local',
  user: 'claudeCode.mcp.scopes.user',
  claudeai: 'claudeCode.mcp.scopes.claudeai',
  managed: 'claudeCode.mcp.scopes.managed',
  dynamic: 'claudeCode.mcp.scopes.dynamic',
  other: 'claudeCode.mcp.scopes.other',
}

/** Состояние словами CLI и тоном: подключён - зелёный, ждёт входа - внимание, упал - красный. */
export const STATUS_VIEW: Record<McpStatus, { tone: BadgeTone; key: ParseKeys }> = {
  connected: { tone: 'success', key: 'claudeCode.mcp.status.connected' },
  pending: { tone: 'info', key: 'claudeCode.mcp.status.pending' },
  'needs-auth': { tone: 'warning', key: 'claudeCode.mcp.status.needsAuth' },
  failed: { tone: 'danger', key: 'claudeCode.mcp.status.failed' },
  disabled: { tone: 'neutral', key: 'claudeCode.mcp.status.disabled' },
  unknown: { tone: 'neutral', key: 'claudeCode.mcp.status.unknown' },
}

/** Через сколько переспросить список после входа: CLI переподключает сервер сам и молчит. */
export const AUTH_RECHECK_MS = [10_000, 25_000, 60_000] as const
