import { it, expect, describe } from 'vitest'

import { KeyedQueue } from './git-write-queue'

/** Задача, которую тест завершает сам: порядок проверяется без таймеров. */
const deferred = () => {
  let finish: (value: string) => void = () => undefined
  let fail: (error: Error) => void = () => undefined
  const promise = new Promise<string>((resolve, reject) => {
    finish = resolve
    fail = reject
  })

  return { promise, finish, fail }
}

/** Дать отработать всем уже готовым продолжениям промисов. */
const settle = () => new Promise((resolve) => setImmediate(resolve))

describe('KeyedQueue', () => {
  it('один ключ - по очереди, в порядке вызова', async () => {
    const queue = new KeyedQueue()
    const started: string[] = []
    const first = deferred()
    const second = deferred()

    const a = queue.run('repo', () => {
      started.push('a')

      return first.promise
    })
    const b = queue.run('repo', () => {
      started.push('b')

      return second.promise
    })

    await settle()
    expect(started).toEqual(['a'])

    first.finish('a done')
    await settle()
    expect(started).toEqual(['a', 'b'])

    second.finish('b done')
    expect(await Promise.all([a, b])).toEqual(['a done', 'b done'])
  })

  it('разные ключи друг друга не ждут', async () => {
    const queue = new KeyedQueue()
    const started: string[] = []
    const blocking = deferred()

    void queue.run('one', () => {
      started.push('one')

      return blocking.promise
    })
    void queue.run('two', () => {
      started.push('two')

      return Promise.resolve('two')
    })

    await settle()
    expect(started).toEqual(['one', 'two'])
    blocking.finish('one')
  })

  it('упавшая задача отдаёт ошибку своему вызывающему и не держит очередь', async () => {
    const queue = new KeyedQueue()
    const failing = deferred()

    const broken = queue.run('repo', () => failing.promise)
    const next = queue.run('repo', () => Promise.resolve('next'))

    failing.fail(new Error('git упал'))

    await expect(broken).rejects.toThrow('git упал')
    expect(await next).toBe('next')
  })

  it('освободившийся ключ не остаётся в карте', async () => {
    const queue = new KeyedQueue()

    await queue.run('repo', () => Promise.resolve('done'))
    await settle()

    expect(queue.busyKeys).toBe(0)
  })
})
