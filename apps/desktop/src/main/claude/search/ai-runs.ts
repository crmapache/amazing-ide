type Run<H> = { handle: H | null; cancelled: boolean }

/**
 * Идущие поиски модели по номеру запроса - и какие из них человек отменил. Отмена называет
 * запрос, а не процесс, а первые секунды это разные вещи: сначала обновляется индекс и
 * пишется корпус, процесса ещё нет. Отмена, знавшая только процессы, проваливалась в эту
 * щель: прогон стартовал, работал до конца и оплачивался, а ответ окно выбрасывало. Здесь
 * запрос известен с момента вопроса, и отмена помнится, пока прогон не кончится.
 * H - то, чем прогон гасится; stop - гасит. Обобщённо, чтобы правило проверялось без процесса.
 */
export class AiRuns<H> {
  private readonly runs = new Map<string, Run<H>>()

  constructor(private readonly stop: (handle: H) => void) {}

  /** Запрос задан - с этого момента отмена по его номеру что-то значит. */
  asked(id: string): void {
    this.runs.set(id, { handle: null, cancelled: false })
  }

  /** У прогона появился процесс; отменённый, пока готовился, гасится сразу. */
  started(id: string, handle: H): void {
    const run = this.runs.get(id)

    if (!run || run.cancelled) {
      this.stop(handle)

      return
    }

    run.handle = handle
  }

  /** Человек нажал Cancel. Ответ - работал ли ещё кто-то над этим. */
  cancel(id: string): boolean {
    const run = this.runs.get(id)

    if (!run) return false

    run.cancelled = true

    if (run.handle !== null) this.stop(run.handle)

    return true
  }

  /** Отменён ли запрос - спрашивается до старта процесса, чтобы он не стартовал вовсе. */
  isCancelled(id: string): boolean {
    return this.runs.get(id)?.cancelled ?? true
  }

  /** Прогон кончился, как бы ни кончился. Ответ - был ли он отменён: тогда его итог никому не новость. */
  finished(id: string): boolean {
    const run = this.runs.get(id)

    this.runs.delete(id)

    return run?.cancelled ?? true
  }

  /** Сколько запросов помнится - для тестов: заданное должно забываться. */
  get size(): number {
    return this.runs.size
  }
}
