import { watch } from 'node:fs'
import type { FSWatcher } from 'node:fs'
import { dirname, basename } from 'node:path'

import { OUTSIDE_FOLDERS_LIMIT } from './outside-watchers.constants'
import { toWindowPath } from './project-paths'
import { WATCH_QUIET_MS } from './project-watcher.constants'

/** Файл вне проекта, открытый вкладкой: в каком проекте вкладка и путь, как его знает окно. */
export type OutsideFile = { projectId: string; path: string }

type WatchedFolder = { watcher: FSWatcher; files: OutsideFile[] }

/**
 * Слежение за файлами вне проекта, открытыми во вкладках редактора: слежение проекта их не
 * видит, а Claude Code пишет и туда (планы, память, соседний репозиторий). Следим за папкой
 * файла, без recursive: запись через временный файл и переименование меняет сам файл, и
 * слежение за ним оборвалось бы на первом сохранении. Одна папка - одно слежение на все её
 * открытые файлы. Изменённые пути копятся и уходят после короткой тишины, как у проекта.
 */
export class OutsideWatchers {
  private readonly folders = new Map<string, WatchedFolder>()
  private readonly changed = new Map<string, Set<string>>()
  private quietTimer: NodeJS.Timeout | null = null

  constructor(private readonly onChange: (projectId: string, paths: string[]) => void) {}

  /** Открытые вкладки вне проекта целиком: прежний набор заменяется этим. */
  set(files: readonly OutsideFile[]): void {
    const byFolder = new Map<string, OutsideFile[]>()

    for (const file of files) {
      const folder = dirname(file.path)

      byFolder.set(folder, [...(byFolder.get(folder) ?? []), file])
    }

    for (const [folder, watched] of this.folders) {
      if (byFolder.has(folder)) continue

      watched.watcher.close()
      this.folders.delete(folder)
    }

    for (const [folder, folderFiles] of byFolder) {
      const watched = this.folders.get(folder)

      if (watched) watched.files = folderFiles
      else if (this.folders.size < OUTSIDE_FOLDERS_LIMIT) this.watch(folder, folderFiles)
    }
  }

  dispose(): void {
    if (this.quietTimer) clearTimeout(this.quietTimer)

    for (const { watcher } of this.folders.values()) watcher.close()

    this.folders.clear()
    this.changed.clear()
  }

  private watch(folder: string, files: OutsideFile[]): void {
    try {
      const watcher = watch(folder, (_eventType, filename) => this.note(folder, filename))

      // Папку удалили или отключили диск: слежение кончилось, вкладка сверится по возврату
      // в окно, IDE работает дальше.
      watcher.on('error', (error) => {
        console.warn(`[watch] слежение за ${folder} прервалось:`, error)
        watcher.close()
        this.folders.delete(folder)
      })
      this.folders.set(folder, { watcher, files })
    } catch (error) {
      console.warn(`[watch] не получилось следить за ${folder}:`, error)
    }
  }

  /** Событие в папке: имени нет - касается всех её открытых файлов. Имена - в NFC, как пути окна. */
  private note(folder: string, filename: string | Buffer | null): void {
    const name = filename === null ? null : toWindowPath(String(filename))
    const files = this.folders.get(folder)?.files ?? []

    for (const file of files) {
      if (name !== null && toWindowPath(basename(file.path)) !== name) continue

      this.changed.set(
        file.projectId,
        (this.changed.get(file.projectId) ?? new Set()).add(file.path),
      )
    }

    if (this.changed.size === 0) return
    if (this.quietTimer) clearTimeout(this.quietTimer)

    this.quietTimer = setTimeout(() => this.flush(), WATCH_QUIET_MS)
  }

  private flush(): void {
    this.quietTimer = null

    for (const [projectId, paths] of this.changed) this.onChange(projectId, [...paths])

    this.changed.clear()
  }
}
