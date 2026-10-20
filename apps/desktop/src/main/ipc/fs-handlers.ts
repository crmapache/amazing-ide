import type { FsPathsInvokeContract } from '@shared/ipc/fs-paths.contract'

import { openOutside } from '../fs/outside-open'
import { locatePath } from '../fs/path-locator'
import type { SearchService } from '../search/search-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type FsPathsChannels = keyof FsPathsInvokeContract

/**
 * Каналы путей из текста ленты: проект - только открытый, путь - строка, дальше -
 * модули main/fs. Сами пути проверяются там же, где по ним ходят.
 */
export const createFsHandlers = (
  workspace: WorkspaceService,
  search: SearchService,
): Pick<InvokeHandlers, FsPathsChannels> => ({
  'fs:locatePath': ({ projectId, path }) => {
    assertString(path, 'path')

    const rootPath = projectRootOf(workspace, projectId)

    return locatePath(rootPath, path, async () => (await search.listFiles(rootPath)).paths)
  },
  'fs:openOutside': ({ projectId, path, reveal }) => {
    assertString(path, 'path')
    projectRootOf(workspace, projectId)

    if (typeof reveal !== 'boolean') throw new Error('Ожидалось да или нет в поле reveal')

    return openOutside(path, reveal)
  },
})
