import type { Project } from '@shared/workspace'

import { ProjectWatcher } from './project-watcher'
import type { WatchBatch } from './watch-batch'

/**
 * Слежение за всеми открытыми проектами: открыли - следим, закрыли - перестали. Что
 * делать с изменениями (сказать окну, перечитать статус git), решает тот, кто создал.
 */
export class ProjectWatchers {
  private readonly watchers = new Map<string, { rootPath: string; watcher: ProjectWatcher }>()

  constructor(private readonly onBatch: (projectId: string, batch: WatchBatch) => void) {}

  /** Открытые проекты поменялись. Возвращает id тех, за кем следить перестали. */
  sync(projects: readonly Project[]): string[] {
    const open = new Map(projects.map((project) => [project.id, project.rootPath]))
    const stopped: string[] = []

    for (const [projectId, { rootPath, watcher }] of this.watchers) {
      if (open.get(projectId) === rootPath) continue

      watcher.close()
      this.watchers.delete(projectId)
      stopped.push(projectId)
    }

    for (const [projectId, rootPath] of open) {
      if (this.watchers.has(projectId)) continue

      const watcher = new ProjectWatcher(rootPath, (batch) => this.onBatch(projectId, batch))

      this.watchers.set(projectId, { rootPath, watcher })
    }

    return stopped
  }

  dispose(): void {
    for (const { watcher } of this.watchers.values()) watcher.close()

    this.watchers.clear()
  }
}
