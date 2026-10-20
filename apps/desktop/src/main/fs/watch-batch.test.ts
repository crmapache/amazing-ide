import { it, expect, describe } from 'vitest'

import { WATCH_PATHS_LIMIT } from './project-watcher.constants'
import { WatchBatchCollector } from './watch-batch'

const event = (path: string | null, extra: { renamed?: boolean; git?: boolean } = {}) => ({
  path,
  renamed: extra.renamed ?? false,
  rescan: false,
  git: extra.git ?? false,
})

describe('WatchBatchCollector', () => {
  it('переименование - перечитать папку над ним и всё под ним; правка - только путь', () => {
    const batch = new WatchBatchCollector()

    batch.add(event('src/new.ts', { renamed: true }))
    batch.add(event('src/new.ts', { renamed: true }))
    batch.add(event('docs/a.md'))
    batch.add(event(null, { git: true }))

    expect(batch.take()).toEqual({
      directories: ['src'],
      renamed: ['src/new.ts'],
      paths: ['src/new.ts', 'docs/a.md'],
      git: true,
    })
    expect(batch.isEmpty).toBe(true)
  })

  it('путь в корне - перечитать корень', () => {
    const batch = new WatchBatchCollector()

    batch.add(event('README.md', { renamed: true }))

    expect(batch.take().directories).toEqual([''])
  })

  it('путей больше предела - перечитать всё', () => {
    const batch = new WatchBatchCollector()

    for (let index = 0; index <= WATCH_PATHS_LIMIT; index += 1) batch.add(event(`f${index}`))

    expect(batch.take()).toEqual({ directories: null, renamed: [], paths: null, git: false })
  })

  it('событие без места - перечитать всё до конца пачки', () => {
    const batch = new WatchBatchCollector()

    batch.add({ path: null, renamed: false, rescan: true, git: true })
    batch.add(event('src', { renamed: true }))

    expect(batch.take()).toEqual({ directories: null, renamed: [], paths: null, git: true })
  })

  it('только события .git - пачка не пустая', () => {
    const batch = new WatchBatchCollector()

    batch.add(event(null, { git: true }))

    expect(batch.isEmpty).toBe(false)
  })
})
