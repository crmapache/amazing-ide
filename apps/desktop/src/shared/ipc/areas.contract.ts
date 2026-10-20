import type { ClaudeComposerInvokeContract } from './claude-composer.contract'
import { CLAUDE_COMPOSER_CHANNELS } from './claude-composer.contract'
import type { ClaudePanelEventContract, ClaudePanelInvokeContract } from './claude-panel.contract'
import { CLAUDE_PANEL_EVENTS, CLAUDE_PANEL_CHANNELS } from './claude-panel.contract'
import type {
  ClaudeSearchEventContract,
  ClaudeSearchInvokeContract,
} from './claude-search.contract'
import { CLAUDE_SEARCH_EVENTS, CLAUDE_SEARCH_CHANNELS } from './claude-search.contract'
import type { ClaudeSettingsInvokeContract } from './claude-settings.contract'
import { CLAUDE_SETTINGS_CHANNELS } from './claude-settings.contract'
import type { ClaudeTabsEventContract, ClaudeTabsInvokeContract } from './claude-tabs.contract'
import { CLAUDE_TABS_EVENTS, CLAUDE_TABS_CHANNELS } from './claude-tabs.contract'
import type { FsPathsInvokeContract } from './fs-paths.contract'
import { FS_PATHS_CHANNELS } from './fs-paths.contract'
import type { ProjectSyncEventContract, ProjectSyncInvokeContract } from './project-sync.contract'
import { PROJECT_SYNC_EVENTS, PROJECT_SYNC_CHANNELS } from './project-sync.contract'

/**
 * Части контракта по областям, собранные в одно место: contract.ts берёт их отсюда
 * целиком и не растёт с каждой новой областью. Новая область - свой файл
 * `<область>.contract.ts` и строка здесь в каждом из четырёх списков.
 */
export type AreaInvokeContract = ClaudeTabsInvokeContract &
  ClaudeSettingsInvokeContract &
  ClaudeComposerInvokeContract &
  ClaudePanelInvokeContract &
  ClaudeSearchInvokeContract &
  FsPathsInvokeContract &
  ProjectSyncInvokeContract

export type AreaEventContract = ClaudeTabsEventContract &
  ClaudePanelEventContract &
  ClaudeSearchEventContract &
  ProjectSyncEventContract

/** Каналы областей в рантайме: их разворачивает INVOKE_CHANNELS. */
export const AREA_CHANNELS = {
  ...CLAUDE_TABS_CHANNELS,
  ...CLAUDE_SETTINGS_CHANNELS,
  ...CLAUDE_COMPOSER_CHANNELS,
  ...CLAUDE_PANEL_CHANNELS,
  ...CLAUDE_SEARCH_CHANNELS,
  ...FS_PATHS_CHANNELS,
  ...PROJECT_SYNC_CHANNELS,
} satisfies Record<keyof AreaInvokeContract, true>

/** События областей: их разворачивает EVENT_CHANNELS. */
export const AREA_EVENTS = {
  ...CLAUDE_TABS_EVENTS,
  ...CLAUDE_PANEL_EVENTS,
  ...CLAUDE_SEARCH_EVENTS,
  ...PROJECT_SYNC_EVENTS,
} satisfies Record<keyof AreaEventContract, true>
