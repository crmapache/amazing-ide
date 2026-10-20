import type { Conversation } from '@shared/claude'
import type { TaskEntry } from '@shared/claude-feed'
import type { Project } from '@shared/workspace'

export type ConversationDockProps = {
  project: Project
  conversation: Conversation
  tasks: readonly TaskEntry[]
}
