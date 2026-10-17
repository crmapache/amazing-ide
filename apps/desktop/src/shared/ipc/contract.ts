import type { AppInfo, ResourceUsage } from '../app-info'
import type { DirectoryEntry } from '../fs'
import type {
  GitHead,
  GitBranches,
  GitPushInfo,
  GitBranchKind,
  GitCloneResult,
  GitActionResult,
} from '../git'
import type { ProjectFileList, TextSearchResult } from '../search'
import type { UpdateStatus } from '../updates'
import type { WorkspaceState } from '../workspace'

/**
 * Единый контракт между окном и главным процессом. Всё, что ходит через IPC,
 * описано здесь, и только здесь: главный процесс регистрирует обработчики по этой
 * карте (main/ipc/handle.ts), окно зовёт их через lib/ipc.ts, и TypeScript не даст
 * разойтись ни имени канала, ни форме запроса, ни ответу.
 *
 * Новый канал: запись в InvokeContract или EventContract, ключ в списке ниже,
 * обработчик в main/ipc/register-handlers.ts. Подробнее - .claude/rules/ipc-contract.md.
 */

type ProjectRequest = { projectId: string }

/** Запрос-ответ: окно спрашивает, главный процесс отвечает. */
export type InvokeContract = {
  'app:getInfo': { request: void; response: AppInfo }
  /**
   * Процессор и память всех процессов IDE. Процессор - среднее с прошлого запроса,
   * поэтому окно спрашивает по таймеру, а не ждёт события.
   */
  'app:getResourceUsage': { request: void; response: ResourceUsage }

  /** Системный выбор папки. Отмена - null. */
  'dialog:pickFolder': { request: { defaultPath: string }; response: string | null }

  'workspace:get': { request: void; response: WorkspaceState }
  /** Системный выбор папки и открытие её проектом. Отмена - состояние не меняется. */
  'workspace:openProject': { request: void; response: WorkspaceState }
  /** Системный диалог «где создать», новая пустая папка, открытие её проектом. */
  'workspace:newProject': { request: void; response: WorkspaceState }
  'workspace:openRecentProject': { request: { rootPath: string }; response: WorkspaceState }
  /** Клон репозитория в новую папку внутри parentPath и открытие его проектом. */
  'workspace:cloneProject': {
    request: { url: string; parentPath: string }
    response: GitCloneResult
  }
  'workspace:closeProject': { request: ProjectRequest; response: WorkspaceState }
  'workspace:activateProject': { request: ProjectRequest; response: WorkspaceState }

  'fs:readDirectory': {
    request: ProjectRequest & { relativePath: string }
    response: DirectoryEntry[]
  }

  /** Все файлы проекта для поиска по имени (Search Everywhere). */
  'search:listFiles': { request: ProjectRequest; response: ProjectFileList }
  /**
   * Строки проекта с текстом, без учёта регистра. Новый поиск отменяет предыдущий
   * незаконченный: ответ отменённого - то, что он успел найти.
   */
  'search:findText': { request: ProjectRequest & { query: string }; response: TextSearchResult }

  /** Ветка проекта. null - папка не репозиторий git. */
  'git:getHead': { request: ProjectRequest; response: GitHead | null }
  'git:listBranches': { request: ProjectRequest; response: GitBranches }
  'git:switchBranch': {
    request: ProjectRequest & { branch: string; kind: GitBranchKind }
    response: GitActionResult
  }
  'git:createBranch': { request: ProjectRequest & { name: string }; response: GitActionResult }
  'git:checkoutRevision': {
    request: ProjectRequest & { revision: string }
    response: GitActionResult
  }
  'git:pull': { request: ProjectRequest; response: GitActionResult }
  /** Что уйдёт при push - для окна подтверждения. null - HEAD не на ветке. */
  'git:getPushInfo': { request: ProjectRequest; response: GitPushInfo | null }
  'git:push': { request: ProjectRequest; response: GitActionResult }

  'updates:getStatus': { request: void; response: UpdateStatus }
  /** Скачать, проверить и поставить. Приложение после этого перезапустится само. */
  'updates:install': { request: void; response: void }
  /** Отложить до следующего запуска. */
  'updates:dismiss': { request: void; response: UpdateStatus }
  'updates:openReleasePage': { request: void; response: void }
}

/** События: главный процесс сообщает окну, что состояние изменилось. */
export type EventContract = {
  'workspace:changed': WorkspaceState
  'updates:status': UpdateStatus
}

export type InvokeChannel = keyof InvokeContract
export type InvokeRequest<C extends InvokeChannel> = InvokeContract[C]['request']
export type InvokeResponse<C extends InvokeChannel> = InvokeContract[C]['response']

export type EventChannel = keyof EventContract
export type EventPayload<E extends EventChannel> = EventContract[E]

/**
 * Список каналов в рантайме: preload пропускает из окна только их. `satisfies`
 * требует ровно те ключи, что в контракте, - забыть канал или оставить лишний
 * не даст компилятор.
 */
export const INVOKE_CHANNELS = Object.keys({
  'app:getInfo': true,
  'app:getResourceUsage': true,
  'dialog:pickFolder': true,
  'workspace:get': true,
  'workspace:openProject': true,
  'workspace:newProject': true,
  'workspace:openRecentProject': true,
  'workspace:cloneProject': true,
  'workspace:closeProject': true,
  'workspace:activateProject': true,
  'fs:readDirectory': true,
  'search:listFiles': true,
  'search:findText': true,
  'git:getHead': true,
  'git:listBranches': true,
  'git:switchBranch': true,
  'git:createBranch': true,
  'git:checkoutRevision': true,
  'git:pull': true,
  'git:getPushInfo': true,
  'git:push': true,
  'updates:getStatus': true,
  'updates:install': true,
  'updates:dismiss': true,
  'updates:openReleasePage': true,
} satisfies Record<InvokeChannel, true>) as InvokeChannel[]

export const EVENT_CHANNELS = Object.keys({
  'workspace:changed': true,
  'updates:status': true,
} satisfies Record<EventChannel, true>) as EventChannel[]
