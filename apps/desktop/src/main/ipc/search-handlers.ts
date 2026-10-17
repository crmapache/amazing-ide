import type { SearchService } from '../search/search-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type SearchChannels = Extract<keyof InvokeHandlers, `search:${string}`>

/** Каналы поиска: проект по id, запрос проверен, дальше - сервис main/search. */
export const createSearchHandlers = (
  workspace: WorkspaceService,
  search: SearchService,
): Pick<InvokeHandlers, SearchChannels> => {
  const root = (projectId: unknown) => projectRootOf(workspace, projectId)

  return {
    'search:listFiles': ({ projectId }) => search.listFiles(root(projectId)),
    'search:findText': ({ projectId, query }) => {
      assertString(query, 'query')

      return search.findText(root(projectId), query)
    },
  }
}
