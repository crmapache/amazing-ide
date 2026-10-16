/**
 * Ключи кэша React Query для данных главного процесса. Одна сущность - один ключ:
 * и запрос, и событие из главного процесса пишут в одно и то же место.
 */
export const QUERY_KEYS = {
  appInfo: ['app', 'info'],
  workspace: ['workspace'],
  updateStatus: ['updates', 'status'],
  directory: (projectId: string, relativePath: string) => [
    'fs',
    'directory',
    projectId,
    relativePath,
  ],
  /** Все каталоги проекта разом: сбросить дерево после смены ветки. */
  projectDirectories: (projectId: string) => ['fs', 'directory', projectId],
  gitHead: (projectId: string) => ['git', 'head', projectId],
  gitBranches: (projectId: string) => ['git', 'branches', projectId],
  gitPushInfo: (projectId: string) => ['git', 'push-info', projectId],
} as const
