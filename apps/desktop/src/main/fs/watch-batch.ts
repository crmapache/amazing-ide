import { posix } from 'node:path'

import { WATCH_PATHS_LIMIT } from './project-watcher.constants'
import type { WatchChange } from './watch-events'

/**
 * Пачка событий слежения. directories - чьё содержимое перечитать (корень - пустая
 * строка); renamed - пути, которые появились, пропали или переименовались: если это
 * папки, всё под ними перечитать; paths - где вообще что-то поменялось. null - событий
 * слишком много или место неизвестно: перечитать всё.
 */
export type WatchBatch = {
  directories: string[] | null
  renamed: string[]
  paths: string[] | null
  git: boolean
}

const parentOf = (path: string): string => {
  const parent = posix.dirname(path)

  return parent === '.' ? '' : parent
}

/** Копит события в пачку. Путей больше предела - пачка говорит «перечитай всё». */
export class WatchBatchCollector {
  private directories = new Set<string>()
  private renamed = new Set<string>()
  private paths = new Set<string>()
  private overflow = false
  private git = false
  private empty = true

  get isEmpty(): boolean {
    return this.empty
  }

  add({ path, renamed, rescan, git }: WatchChange): void {
    this.empty = false
    this.git ||= git
    this.overflow ||= rescan

    if (path === null || this.overflow) return

    this.paths.add(path)

    if (renamed) {
      this.renamed.add(path)
      this.directories.add(parentOf(path))
    }

    if (this.paths.size > WATCH_PATHS_LIMIT) this.overflow = true
  }

  /** Отдать накопленное и начать заново. */
  take(): WatchBatch {
    const batch: WatchBatch = this.overflow
      ? { directories: null, renamed: [], paths: null, git: this.git }
      : {
          directories: [...this.directories],
          renamed: [...this.renamed],
          paths: [...this.paths],
          git: this.git,
        }

    this.directories = new Set()
    this.renamed = new Set()
    this.paths = new Set()
    this.overflow = false
    this.git = false
    this.empty = true

    return batch
  }
}
