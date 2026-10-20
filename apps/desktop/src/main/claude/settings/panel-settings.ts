import type { PermissionMode } from '@shared/claude'
import type { ProjectClaudeSettings } from '@shared/claude-config'
import type { PanelPrefs, SettingSources } from '@shared/claude-prefs'
import { DEFAULT_PANEL_PREFS } from '@shared/claude-prefs'

import { ClaudeConfigDesk } from '../config/config-desk'
import { claudeHome } from '../history/transcript-paths'
import type { ToolsHost } from '../tools/tools-host'
import { repositoryOverrides } from './account-override'
import { isBypassDisabled, allowedPinnedMode, defaultPermissionMode } from './default-mode'
import { applyPrefsPatch, changedSourceProjects } from './panel-prefs'

/**
 * Настройки панели (экран Settings) и то, что за ними стоит в главном процессе:
 * перезапуск процессов проекта после смены источников настроек, режим новой вкладки
 * по тем же слоям, с которыми процесс поднимется, ответ экранам о файлах настроек
 * проекта и собственные настройки Claude Code (`/config`). Владелец значений - здесь,
 * пишет их на диск и рассылает окну сервис разговоров (onChange).
 */
export class PanelSettings {
  prefs: PanelPrefs = DEFAULT_PANEL_PREFS
  /** Экран Claude Code settings: список `/config` от CLI и правки через него. */
  readonly config: ClaudeConfigDesk

  constructor(
    private readonly host: ToolsHost,
    private readonly onChange: () => void,
  ) {
    this.config = new ClaudeConfigDesk(host, (projectPath) => this.sourcesOf(projectPath))
  }

  /** Источники настроек проекта: нет записи - все слои, как CLI делает сам. */
  sourcesOf(projectPath: string): SettingSources {
    return this.prefs.settingSources[projectPath] ?? 'all'
  }

  /**
   * Патч из окна; негодное поле - отказ целиком. Сменились источники проекта - его
   * процессы перезапустятся, как только освободятся (идущий ход не рвётся): CLI читает
   * слои только на старте, и без этого настройка выглядела бы неработающей ровно в тех
   * вкладках, ради которых её открыли.
   */
  apply(patch: unknown): void {
    const before = this.prefs

    this.prefs = applyPrefsPatch(before, patch)

    const changed = changedSourceProjects(before.settingSources, this.prefs.settingSources)

    for (const runtime of this.host.runtimes()) {
      if (changed.includes(runtime.meta.projectPath)) runtime.restartProcess()
    }

    this.onChange()
  }

  /** Режим, закреплённый для новых вкладок, - если проект его допускает; иначе null. */
  async pinnedMode(projectPath: string): Promise<PermissionMode | null> {
    const mode = this.prefs.newTabMode

    if (mode !== 'bypassPermissions') return mode

    const home = await claudeHome()

    return allowedPinnedMode(
      mode,
      await isBypassDisabled(projectPath, home, this.sourcesOf(projectPath)),
    )
  }

  /** Режим новой вкладки по настройкам CLI - из слоёв, с которыми процесс поднимется. */
  async defaultMode(projectPath: string): Promise<PermissionMode> {
    return defaultPermissionMode(projectPath, await claudeHome(), this.sourcesOf(projectPath))
  }

  /**
   * Что файлы настроек проекта значат для экранов: что репозиторий задаёт прямо сейчас
   * (только имена), знает ли CLI флаг слоёв, запрещён ли режим без вопросов.
   */
  async projectInfo(projectPath: string): Promise<ProjectClaudeSettings> {
    const [cli, home] = await Promise.all([this.host.cli(), claudeHome()])
    const [overrides, bypassDisabled] = await Promise.all([
      repositoryOverrides(projectPath),
      isBypassDisabled(projectPath, home, this.sourcesOf(projectPath)),
    ])

    return { overrides, sourcesFlag: cli ? cli.features.settingSources : null, bypassDisabled }
  }
}
