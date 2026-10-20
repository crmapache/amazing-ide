import { it, expect, describe } from 'vitest'

import { CoalescedRun } from './coalesced-run'

/** Задача, которую тест заканчивает сам, - видно, сколько прогонов и когда. */
const controlledTask = () => {
  const finishers: ((value: number) => void)[] = []
  let started = 0
  const task = () =>
    new Promise<number>((resolve) => {
      started += 1
      finishers.push(resolve)
    })

  return { task, finishers, started: () => started }
}

describe('CoalescedRun', () => {
  it('свободная - запускает сразу', async () => {
    const { task, finishers, started } = controlledTask()
    const result = new CoalescedRun(task).run()

    expect(started()).toBe(1)
    finishers[0]?.(1)
    expect(await result).toBe(1)
  })

  it('просьбы во время прогона - один следующий прогон на всех', async () => {
    const { task, finishers, started } = controlledTask()
    const runner = new CoalescedRun(task)
    const first = runner.run()
    const second = runner.run()
    const third = runner.run()

    expect(started()).toBe(1)
    finishers[0]?.(1)
    expect(await first).toBe(1)
    await Promise.resolve()
    expect(started()).toBe(2)
    finishers[1]?.(2)
    expect(await second).toBe(2)
    expect(await third).toBe(2)
    expect(started()).toBe(2)
  })

  it('упавший прогон не мешает следующему', async () => {
    let calls = 0
    const runner = new CoalescedRun(() => {
      calls += 1

      return calls === 1 ? Promise.reject(new Error('git упал')) : Promise.resolve(calls)
    })
    const failed = runner.run()
    const next = runner.run()

    await expect(failed).rejects.toThrow('git упал')
    expect(await next).toBe(2)
  })
})
