import type { ProjectDiskChange } from '../fs'
import type { GitStatus } from '../git'

/**
 * Часть контракта (contract.ts) про то, что окно узнаёт о проекте без своего вопроса:
 * главный процесс следит за диском и .git и сам сообщает, что дерево и статусы git
 * устарели. Отдельным файлом по области, правила те же (.claude/rules/ipc-contract.md).
 */
export type ProjectSyncInvokeContract = {
  /**
   * Статусы файлов по git - свежие, не из памяти. null - папка не в git (или в ней всё
   * игнорируется) или git не ответил: тогда дерево просто без цветов.
   */
  'git:getStatus': { request: { projectId: string }; response: GitStatus | null }
}

export type ProjectSyncEventContract = {
  /** На диске проекта появилось, пропало или переименовалось; или поменялся .git. */
  'fs:changed': ProjectDiskChange
  /** Статусы git проекта стали другими - после изменений на диске или в .git. */
  'git:status': { projectId: string; status: GitStatus | null }
}

/** Каналы этой части в рантайме: их разворачивает INVOKE_CHANNELS. */
export const PROJECT_SYNC_CHANNELS = {
  'git:getStatus': true,
} satisfies Record<keyof ProjectSyncInvokeContract, true>

/** События этой части: их разворачивает EVENT_CHANNELS. */
export const PROJECT_SYNC_EVENTS = {
  'fs:changed': true,
  'git:status': true,
} satisfies Record<keyof ProjectSyncEventContract, true>
