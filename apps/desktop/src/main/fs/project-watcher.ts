import { watch } from 'node:fs'
import type { FSWatcher } from 'node:fs'

import { WATCH_QUIET_MS, WATCH_MAX_DELAY_MS } from './project-watcher.constants'
import { readRepoSurroundings } from './repo-surroundings'
import { WatchBatchCollector } from './watch-batch'
import type { WatchBatch } from './watch-batch'
import { classifyGitDirEvent, classifyProjectEvent, classifyOuterIgnoreEvent } from './watch-events'
import type { WatchChange } from './watch-events'

type Classify = (eventType: string, filename: string | null) => WatchChange | null

/**
 * Слежение за папкой проекта: fs.watch с recursive - на macOS это FSEvents, один поток
 * на всё дерево, без обхода папок. События копятся в пачку и уходят после короткой
 * тишины, но не реже раза в секунду. Проект - подпапка репозитория: отдельно слушаем
 * .git выше корня (иначе git add и коммиты в терминале прошли бы мимо) и папки над
 * проектом, чьи .gitignore красят его файлы.
 */
export class ProjectWatcher {
  private readonly watchers: FSWatcher[] = []
  private readonly batch = new WatchBatchCollector()
  private quietTimer: NodeJS.Timeout | null = null
  private deadlineTimer: NodeJS.Timeout | null = null
  private closed = false

  constructor(
    rootPath: string,
    private readonly onBatch: (batch: WatchBatch) => void,
  ) {
    this.watch(rootPath, true, classifyProjectEvent)
    void readRepoSurroundings(rootPath).then(({ gitDir, ignoreDirs }) => {
      if (this.closed) return

      if (gitDir) {
        this.watch(gitDir, true, (_eventType, filename) =>
          filename === null ? classifyProjectEvent('rename', null) : classifyGitDirEvent(filename),
        )
      }

      for (const folder of ignoreDirs) {
        this.watch(folder, false, (_eventType, filename) => classifyOuterIgnoreEvent(filename))
      }
    })
  }

  close(): void {
    this.closed = true
    this.clearTimers()

    for (const watcher of this.watchers) watcher.close()
  }

  private watch(path: string, recursive: boolean, classify: Classify): void {
    try {
      const watcher = watch(path, { recursive }, (eventType, filename) => {
        const change = classify(eventType, filename)

        if (change) this.note(change)
      })

      // Папку удалили или отключили диск: слежение кончилось, IDE работает дальше.
      watcher.on('error', (error) => {
        console.warn(`[watch] слежение за ${path} прервалось:`, error)
        watcher.close()
      })
      this.watchers.push(watcher)
    } catch (error) {
      console.warn(`[watch] не получилось следить за ${path}:`, error)
    }
  }

  private note(change: WatchChange): void {
    if (this.closed) return

    this.batch.add(change)

    if (this.quietTimer) clearTimeout(this.quietTimer)

    this.quietTimer = setTimeout(() => this.flush(), WATCH_QUIET_MS)
    this.deadlineTimer ??= setTimeout(() => this.flush(), WATCH_MAX_DELAY_MS)
  }

  private flush(): void {
    this.clearTimers()

    if (this.closed || this.batch.isEmpty) return

    this.onBatch(this.batch.take())
  }

  private clearTimers(): void {
    if (this.quietTimer) clearTimeout(this.quietTimer)
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer)

    this.quietTimer = null
    this.deadlineTimer = null
  }
}
