import type { GitStatus } from '@shared/git'

import { CoalescedRun } from './coalesced-run'
import { readGitScope, readGitStatus } from './git-status'
import { isIgnoredPath } from './git-status-output'
import type { GitScope } from './git-status-output'

/** Как читать: где проект в репозитории и сам статус. Подменяется в тестах. */
export type GitStatusReader = {
  scope: (rootPath: string) => Promise<GitScope | null>
  status: (rootPath: string, scope: GitScope) => Promise<GitStatus | null>
}

/** Что поменялось: в .git и где в файлах проекта (null - неизвестно где). */
export type GitStatusTrigger = { git: boolean; paths: string[] | null }

type Tracked = {
  runner: CoalescedRun<GitStatus | null>
  rootPath: string
  /** Где проект в репозитории; undefined - ещё не узнавали или пора узнать заново. */
  scope: GitScope | null | undefined
  last: GitStatus | null
  /** Последний разосланный статус строкой: тот же самый второй раз окну не шлём. */
  sent: string | null
}

const READER: GitStatusReader = { scope: readGitScope, status: readGitStatus }

/**
 * Статусы git открытых проектов. Владелец - главный процесс: перечитывает статус, когда
 * на диске или в .git что-то поменялось, и сам сообщает окну, если он стал другим.
 * Чтения одного проекта идут по одному: пачка изменений во время чтения даёт одно
 * следующее, а не очередь из git status.
 */
export class GitStatusService {
  private readonly projects = new Map<string, Tracked>()

  constructor(
    private readonly onStatus: (projectId: string, status: GitStatus | null) => void,
    private readonly reader: GitStatusReader = READER,
  ) {}

  /**
   * Свежий статус для окна - с проверкой, в репозитории ли проект: окно спрашивает при
   * открытии и при возврате, а git init выше папки проекта слежение не видит. С этого
   * вопроса проект и начинает перечитываться сам.
   */
  get(projectId: string, rootPath: string): Promise<GitStatus | null> {
    const tracked = this.track(projectId, rootPath)

    tracked.scope = undefined

    return tracked.runner.run()
  }

  /**
   * На диске проекта что-то поменялось. Не перечитываем проект, о котором окно не
   * спрашивало, и изменения только внутри игнорируемого (логи, сборки): статус от них
   * не меняется, а пишут туда без перерыва.
   */
  changed(projectId: string, { git, paths }: GitStatusTrigger): void {
    const tracked = this.projects.get(projectId)

    if (!tracked) return

    const { last } = tracked

    if (git) tracked.scope = undefined
    else if (paths && last && paths.every((path) => isIgnoredPath(last, path))) return

    tracked.runner
      .run()
      .catch((error: unknown) => console.warn('[git] статус не перечитался:', error))
  }

  /** Проект закрыли: больше не читать и не рассылать. */
  forget(projectId: string): void {
    this.projects.delete(projectId)
  }

  private track(projectId: string, rootPath: string): Tracked {
    const existing = this.projects.get(projectId)

    if (existing?.rootPath === rootPath) return existing

    const tracked: Tracked = {
      rootPath,
      scope: undefined,
      last: null,
      sent: null,
      runner: new CoalescedRun(() => this.read(projectId, tracked)),
    }

    this.projects.set(projectId, tracked)

    return tracked
  }

  private async read(projectId: string, tracked: Tracked): Promise<GitStatus | null> {
    const { rootPath } = tracked

    if (tracked.scope === undefined) tracked.scope = await this.reader.scope(rootPath)

    const status = tracked.scope === null ? null : await this.reader.status(rootPath, tracked.scope)
    const serialized = JSON.stringify(status)

    tracked.last = status

    // Проект успели закрыть, пока шло чтение, - окну он уже не нужен.
    if (this.projects.get(projectId) === tracked && serialized !== tracked.sent) {
      tracked.sent = serialized
      this.onStatus(projectId, status)
    }

    return status
  }
}
