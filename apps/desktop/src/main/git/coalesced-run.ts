/**
 * Задача, которую просят чаще, чем она успевает: идёт прогон - следующий встаёт за ним,
 * один на всех, кто попросил за это время. Так каждый получает результат прогона,
 * начатого не раньше его просьбы, а одновременно идёт не больше одного.
 */
export class CoalescedRun<T> {
  private running: Promise<T> | null = null
  private queued: Promise<T> | null = null

  constructor(private readonly task: () => Promise<T>) {}

  run(): Promise<T> {
    if (!this.running) return this.start()

    this.queued ??= this.running
      .catch(() => undefined)
      .then(() => {
        this.queued = null

        return this.start()
      })

    return this.queued
  }

  private start(): Promise<T> {
    const running = this.task().finally(() => {
      if (this.running === running) this.running = null
    })

    this.running = running

    return running
  }
}
