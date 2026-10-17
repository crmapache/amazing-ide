/**
 * Очередь по ключу: задачи с одним ключом идут строго одна за другой в порядке
 * вызова, с разными - параллельно. Упавшая задача очередь не останавливает: её
 * ошибка достаётся только её вызывающему.
 */
export class KeyedQueue {
  private readonly tails = new Map<string, Promise<void>>()

  /** Задача начнётся, когда закончатся все поставленные раньше с тем же ключом. */
  run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve()
    const result = previous.then(task)
    const tail = result.then(
      () => undefined,
      () => undefined,
    )

    this.tails.set(key, tail)
    // Ключ без задач не держим: проекты открываются и закрываются, карта не растёт.
    void tail.then(() => {
      if (this.tails.get(key) === tail) this.tails.delete(key)
    })

    return result
  }

  /** Сколько ключей сейчас заняты - чтобы проверить, что карта не растёт. */
  get busyKeys(): number {
    return this.tails.size
  }
}

/**
 * Записывающие команды git (pull, push, переключение и создание веток, checkout) по
 * корню проекта. Иначе они идут одновременно: pull из меню долго качает, index.lock
 * при этом не держит, checkout тега из поиска успевает пройти - и pull перематывает
 * уже новый HEAD. Проверка и действие (список веток, затем switch) стоят в очереди
 * вместе: проверка видит состояние после предыдущей команды. Чтения (ветка,
 * список веток, push info, поиск) не ждут: состояние они не меняют, а шапка не
 * должна замирать на всё время долгого pull.
 *
 * Ключ - корень проекта, а не репозитория: два открытых проекта из одного
 * репозитория (корень и подпапка) друг друга не ждут. Зато очередь ставится сразу
 * при вызове, без похода в git за корнем репозитория, и порядок вызовов сохраняется.
 */
const writes = new KeyedQueue()

/** Поставить записывающую команду в очередь репозитория проекта. */
export const queueGitWrite = <T>(rootPath: string, task: () => Promise<T>): Promise<T> =>
  writes.run(rootPath, task)
