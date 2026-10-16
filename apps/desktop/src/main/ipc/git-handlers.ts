import type { GitBranchKind } from '@shared/git'

import { createBranch, listBranches, switchBranch, checkoutRevision } from '../git/git-branches'
import { readHead } from '../git/git-head'
import { pull, push, readPushInfo } from '../git/git-remote'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertOneOf, assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

type GitChannels = Extract<keyof InvokeHandlers, `git:${string}`>

const BRANCH_KINDS: readonly GitBranchKind[] = ['local', 'remote']

/** Каналы git: проект по id, данные проверены, дальше - модули main/git. */
export const createGitHandlers = (
  workspace: WorkspaceService,
): Pick<InvokeHandlers, GitChannels> => {
  const root = (projectId: unknown) => projectRootOf(workspace, projectId)

  return {
    'git:getHead': ({ projectId }) => readHead(root(projectId)),
    'git:listBranches': ({ projectId }) => listBranches(root(projectId)),
    'git:switchBranch': ({ projectId, branch, kind }) => {
      assertString(branch, 'branch')

      return switchBranch(root(projectId), branch, assertOneOf(kind, BRANCH_KINDS, 'kind'))
    },
    'git:createBranch': ({ projectId, name }) => {
      assertString(name, 'name')

      return createBranch(root(projectId), name)
    },
    'git:checkoutRevision': ({ projectId, revision }) => {
      assertString(revision, 'revision')

      return checkoutRevision(root(projectId), revision)
    },
    'git:pull': ({ projectId }) => pull(root(projectId)),
    'git:getPushInfo': ({ projectId }) => readPushInfo(root(projectId)),
    'git:push': ({ projectId }) => push(root(projectId)),
  }
}
