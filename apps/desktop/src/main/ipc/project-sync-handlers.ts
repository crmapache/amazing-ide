import type { ProjectSyncInvokeContract } from '@shared/ipc/project-sync.contract'

import type { GitStatusService } from '../git/git-status-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { projectRootOf } from './workspace-handlers'

/** Каналы того, что главный процесс знает о проекте сам: статусы git. Логика - в сервисе. */
export const createProjectSyncHandlers = (
  workspace: WorkspaceService,
  gitStatus: GitStatusService,
): Pick<InvokeHandlers, keyof ProjectSyncInvokeContract> => ({
  'git:getStatus': ({ projectId }) => {
    const rootPath = projectRootOf(workspace, projectId)

    return gitStatus.get(projectId, rootPath)
  },
})
