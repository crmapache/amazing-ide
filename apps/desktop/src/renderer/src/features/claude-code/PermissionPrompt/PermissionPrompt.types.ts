import type { Conversation, PendingRequest } from '@shared/claude'

export type PermissionRequest = Extract<PendingRequest, { kind: 'permission' }>

export type PermissionPromptProps = {
  conversation: Conversation
  request: PermissionRequest
}

export type PermissionPreviewProps = {
  request: PermissionRequest
}
