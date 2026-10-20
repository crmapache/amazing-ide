import type { ClaudeSearchInvokeContract } from '@shared/ipc/claude-search.contract'

import type { WorkspaceService } from '../workspace/workspace-service'
import type { SearchDesk } from '../claude/search/search-desk'
import type { InvokeHandlers } from './handle'
import { assertOneOf, assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

/** Самый длинный запрос из окна: поле поиска, а не вставленный лог. */
const MAX_QUERY_CHARS = 2_000

/** Описание для модели длиннее - уже не описание; номер прогона - короткая строка окна. */
const MAX_ASK_CHARS = 4_000
const MAX_RUN_ID_CHARS = 100

const assertFlag = (value: unknown, name: string): boolean => {
  if (typeof value !== 'boolean') throw new Error(`Ожидался флаг в поле ${name}`)

  return value
}

/**
 * Каналы поиска по разговорам: проект - только открытый, по id вкладки проекта; логика -
 * в main/claude/search.
 */
export const createClaudeSearchHandlers = (
  workspace: WorkspaceService,
  search: SearchDesk,
): Pick<InvokeHandlers, keyof ClaudeSearchInvokeContract> => ({
  'claudeSearch:find': ({ projectId, sessionId, scope, query, matchCase, wholeWords }) => {
    assertString(query, 'query')
    if (sessionId !== null) assertString(sessionId, 'sessionId')

    return search.find(projectRootOf(workspace, projectId), {
      sessionId,
      scope: assertOneOf(scope, ['chat', 'project'], 'scope'),
      query: query.slice(0, MAX_QUERY_CHARS),
      matchCase: assertFlag(matchCase, 'matchCase'),
      wholeWords: assertFlag(wholeWords, 'wholeWords'),
    })
  },
  'claudeSearch:ask': ({ projectId, runId, query }) => {
    assertString(runId, 'runId')
    assertString(query, 'query')

    return search.ask(
      projectRootOf(workspace, projectId),
      runId.slice(0, MAX_RUN_ID_CHARS),
      query.slice(0, MAX_ASK_CHARS),
    )
  },
  'claudeSearch:cancel': ({ runId }) => {
    assertString(runId, 'runId')

    search.cancel(runId.slice(0, MAX_RUN_ID_CHARS))
  },
})
