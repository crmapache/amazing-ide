import type { Conversation } from '@shared/claude'
import type {
  McpScope,
  McpAction,
  McpServer,
  McpAddScope,
  McpAddRequest,
} from '@shared/claude-tools'
import type { Project } from '@shared/workspace'

export type McpServersProps = {
  /** Разговор, у процесса которого спрашиваются серверы проекта. */
  conversation: Conversation
  project: Project
}

export type McpServerRowProps = {
  server: McpServer
  busy: boolean
  onAction: (server: McpServer, action: McpAction) => void
  onRemove: (server: McpServer) => void
}

export type McpAddFormProps = {
  busy: boolean
  onAdd: (server: McpAddRequest) => void
}

/** Группа серверов по месту настройки - заголовок и строки. */
export type McpGroup = { scope: McpScope; servers: McpServer[] }

/** Что делают с серверами: действие у процесса, добавить, удалить. */
export type McpCommand =
  | { kind: 'act'; server: McpServer; action: McpAction }
  | { kind: 'add'; server: McpAddRequest }
  | { kind: 'remove'; server: McpServer; scope: McpAddScope }
