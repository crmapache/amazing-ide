import type { ProjectSyncInvokeContract } from '@shared/ipc/project-sync.contract'

import type { OutsideFile, OutsideWatchers } from '../fs/outside-watchers'
import { OUTSIDE_FILES_LIMIT } from '../fs/outside-watchers.constants'
import { outsidePath } from '../fs/path-location'
import type { GitStatusService } from '../git/git-status-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { projectRootOf } from './workspace-handlers'

/**
 * Файлы вне проекта от окна: только с открытым проектом и годным абсолютным путём, не
 * больше предела. Негодное молча отбрасывается - это слежение, а не действие человека.
 */
const outsideFilesOf = (workspace: WorkspaceService, files: unknown): OutsideFile[] => {
  if (!Array.isArray(files)) throw new Error('Ожидался список файлов в поле files')

  return files.slice(0, OUTSIDE_FILES_LIMIT).flatMap((file: unknown) => {
    const { projectId, path } = (file ?? {}) as Record<string, unknown>

    if (typeof projectId !== 'string' || typeof path !== 'string') return []
    if (!workspace.findProject(projectId)) return []

    const absolute = outsidePath(path)

    // Путь окна остаётся ключом: им же событие назовёт файл, и вкладка его узнает.
    return absolute === path ? [{ projectId, path }] : []
  })
}

/**
 * Каналы того, что главный процесс знает о проекте сам: статусы git и слежение за файлами
 * вне проекта, открытыми вкладками. Логика - в сервисах.
 */
export const createProjectSyncHandlers = (
  workspace: WorkspaceService,
  gitStatus: GitStatusService,
  outsideWatchers: OutsideWatchers,
): Pick<InvokeHandlers, keyof ProjectSyncInvokeContract> => ({
  'git:getStatus': ({ projectId }) => {
    const rootPath = projectRootOf(workspace, projectId)

    return gitStatus.get(projectId, rootPath)
  },
  'fs:watchOutside': ({ files }) => {
    outsideWatchers.set(outsideFilesOf(workspace, files))
  },
})
