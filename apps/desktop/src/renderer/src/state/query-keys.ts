/**
 * Ключи кэша React Query для данных главного процесса. Одна сущность - один ключ:
 * и запрос, и событие из главного процесса пишут в одно и то же место.
 */
export const QUERY_KEYS = {
  appInfo: ['app', 'info'],
  resourceUsage: ['app', 'resource-usage'],
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
  /** Файлы проекта и найденный текст - для поиска везде. */
  projectFiles: (projectId: string) => ['search', 'files', projectId],
  textSearch: (projectId: string, query: string) => ['search', 'text', projectId, query],
  gitHead: (projectId: string) => ['git', 'head', projectId],
  gitBranches: (projectId: string) => ['git', 'branches', projectId],
  gitPushInfo: (projectId: string) => ['git', 'push-info', projectId],
  /** Ключ мутации pull: «git занят» видят все, кто зовёт действия git проекта. */
  gitPull: (projectId: string) => ['git', 'pull', projectId],
} as const
