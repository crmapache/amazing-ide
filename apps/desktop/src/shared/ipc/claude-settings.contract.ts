import type { ClaudeConfigView, ProjectClaudeSettings } from '../claude-config'

type ProjectRequest = { projectId: string }

/**
 * Часть контракта (contract.ts) про экраны Settings, которым нужен главный процесс
 * сверх `claude:setPrefs`: слои настроек Claude Code проекта и его собственные
 * настройки (`/config`). Отдельным файлом по области: общий контракт перерос лимит
 * строк. В InvokeContract и INVOKE_CHANNELS входит целиком, правила те же
 * (.claude/rules/ipc-contract.md).
 */
export type ClaudeSettingsInvokeContract = {
  /**
   * Что файлы настроек Claude Code проекта значат для панели: что в репозитории
   * перебивает вход (только имена), знает ли CLI флаг слоёв, запрещён ли bypass.
   */
  'claudeConfig:project': { request: ProjectRequest; response: ProjectClaudeSettings }
  /** Собственные настройки Claude Code (`/config`): список от CLI и действующие значения. */
  'claudeConfig:list': { request: ProjectRequest; response: ClaudeConfigView }
  /** Поменять одну настройку через `/config` CLI; исход - по перечитанному файлу. */
  'claudeConfig:set': {
    request: ProjectRequest & { key: string; value: string }
    response: ClaudeConfigView
  }
}

/** Каналы этой части в рантайме: их разворачивает INVOKE_CHANNELS. */
export const CLAUDE_SETTINGS_CHANNELS = {
  'claudeConfig:project': true,
  'claudeConfig:list': true,
  'claudeConfig:set': true,
} satisfies Record<keyof ClaudeSettingsInvokeContract, true>
