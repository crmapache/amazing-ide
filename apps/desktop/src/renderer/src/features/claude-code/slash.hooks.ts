import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { Conversation } from '@shared/claude'
import { EFFORT_LEVELS } from '@shared/claude'
import type { Project } from '@shared/workspace'
import { useQuery } from '@tanstack/react-query'

import { invoke } from '../../lib/ipc'
import { QUERY_KEYS } from '../../state/query-keys'
import {
  usePanelPrefs,
  useModelCatalog,
  useSlashCommands,
  useBuiltinCommands,
} from './claude.queries'
import { usePanelCommands } from './panel-commands.hooks'
import { DISK_COMMANDS_REFRESH_MS } from './slash-catalog.constants'
import {
  PANEL_COMMANDS,
  PANEL_ARGUMENTS,
  BUILTIN_COMMANDS,
  DEFAULT_ARGUMENT,
  BUILTIN_ARGUMENTS,
} from './slash.constants'
import type { CommandEntry, CommandOption } from './slash.types'
import { withBuiltins, buildCommands } from './slash.utils'
import { FALLBACK_MODELS, DEFAULT_MODEL_VALUE } from './ComposerStatus/ComposerStatus.constants'

/**
 * Каталог «/» для поля: команды панели (только те, что умеют что-то в IDE), встроенные
 * с пояснениями, команды от CLI (свои - и до первого хода) и команды с диска. Диск
 * перечитывается, пока поле в фокусе: новый скилл виден за пару секунд и до первого
 * сообщения.
 */
export const useCommandCatalog = (
  project: Project,
  conversation: Conversation | null,
  isActive: boolean,
) => {
  const { t } = useTranslation()
  const panelActions = usePanelCommands(conversation)
  const projectCommands = useSlashCommands(project.rootPath)
  const builtins = useBuiltinCommands()
  const cli = useMemo(() => withBuiltins(projectCommands, builtins), [projectCommands, builtins])
  const disk = useQuery({
    queryKey: QUERY_KEYS.claudeCommands(project.id),
    queryFn: () => invoke('claude:listCommands', { projectId: project.id }),
    staleTime: DISK_COMMANDS_REFRESH_MS,
    refetchInterval: isActive ? DISK_COMMANDS_REFRESH_MS : false,
  })
  const models = useModelCatalog()
  const { customModels } = usePanelPrefs()
  const panelIds = Object.keys(panelActions).join(' ')

  const argumentSets = useMemo((): Record<string, CommandOption[]> => {
    const catalog = models.length > 0 ? models : FALLBACK_MODELS
    const named = catalog.filter((model) => model.value !== DEFAULT_MODEL_VALUE)
    const custom = customModels.filter((name) => !named.some((model) => model.value === name))

    return {
      model: [
        { id: DEFAULT_ARGUMENT, hint: t('claudeCode.model.defaultHint') },
        ...named.map((model) => ({
          id: model.value,
          hint: model.description || model.displayName,
        })),
        ...custom.map((name) => ({ id: name, hint: t('claudeCode.slash.customModel') })),
      ],
      effort: [
        { id: DEFAULT_ARGUMENT, hint: t('claudeCode.effort.defaultHint') },
        ...EFFORT_LEVELS.map((level) => ({
          id: level,
          hint: t(`claudeCode.effort.hints.${level}`),
        })),
      ],
      // /fast on|off - значения второго шага; голая /fast переключает.
      fast: [
        { id: 'on', hint: t('claudeCode.fast.argumentOn') },
        { id: 'off', hint: t('claudeCode.fast.argumentOff') },
      ],
    }
  }, [models, customModels, t])

  const commands = useMemo(() => {
    const panel = PANEL_COMMANDS.filter((id) => panelIds.split(' ').includes(id)).map(
      (id): CommandEntry => ({
        id,
        hint: t(`claudeCode.slash.panel.${id}`),
        argumentHint: PANEL_ARGUMENTS[id],
        group: 'panel',
      }),
    )
    const builtin = BUILTIN_COMMANDS.map((id): CommandEntry => ({
      id,
      hint: t(`claudeCode.slash.builtin.${id}`),
      argumentHint: BUILTIN_ARGUMENTS[id],
      group: 'built-in',
    }))

    return buildCommands(panel, builtin, cli, disk.data ?? [])
  }, [panelIds, cli, disk.data, t])

  return { commands, argumentSets, panelActions }
}
