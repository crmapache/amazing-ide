import type { ClaudeSettingsInvokeContract } from '@shared/ipc/claude-settings.contract'

import type { ClaudeService } from '../claude/claude-service'
import type { WorkspaceService } from '../workspace/workspace-service'
import type { InvokeHandlers } from './handle'
import { assertString } from './validate'
import { projectRootOf } from './workspace-handlers'

/** Ключ `/config`: имя настройки, как его пишет справка CLI. */
const CONFIG_KEY = /^[A-Za-z][A-Za-z0-9_]{0,80}$/

/** Значение - одна строка разумной длины; что из вариантов, проверит сам список CLI. */
const MAX_CONFIG_VALUE = 500

const assertConfigKey = (value: unknown): string => {
  assertString(value, 'key')

  if (!CONFIG_KEY.test(value)) throw new Error('Недопустимый ключ настройки')

  return value
}

const assertConfigValue = (value: unknown): string => {
  assertString(value, 'value')

  if (value.length > MAX_CONFIG_VALUE || value.includes('\0')) {
    throw new Error('Недопустимое значение настройки')
  }

  return value
}

/**
 * Каналы экранов Settings, которым нужен главный процесс: файлы настроек проекта и
 * собственные настройки Claude Code. Проект - только открытый, по id вкладки.
 */
export const createClaudeSettingsHandlers = (
  workspace: WorkspaceService,
  claude: ClaudeService,
): Pick<InvokeHandlers, keyof ClaudeSettingsInvokeContract> => {
  const root = (projectId: unknown) => projectRootOf(workspace, projectId)

  return {
    'claudeConfig:project': ({ projectId }) => claude.settings.projectInfo(root(projectId)),
    'claudeConfig:list': ({ projectId }) => claude.settings.config.list(root(projectId)),
    'claudeConfig:set': ({ projectId, key, value }) =>
      claude.settings.config.set(root(projectId), assertConfigKey(key), assertConfigValue(value)),
  }
}
