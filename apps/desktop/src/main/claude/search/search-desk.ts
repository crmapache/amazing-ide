import type {
  SearchScope,
  AiSearchStep,
  SearchAnswer,
  AiSearchOutcome,
} from '@shared/claude-search'

import type { ClaudeCli } from '../cli/cli-locator'
import { AiRuns } from './ai-runs'
import { runAiSearch } from './ai-search-run'
import { hitOf, indexDirFor, transcriptsOf } from './search-files'
import { SearchIndex } from './search-index'
import { snippetAround } from './search-snippets'
import { HIT_LIMIT, WARM_UP_DELAY_MS } from './search.constants'

export type SearchDeskHost = {
  /** Папка индексов в userData: по папке на проект. */
  dir: string
  /** CLI выбранного аккаунта: поиск модели оплачивает он. */
  cli: () => Promise<ClaudeCli | null>
  /** Шаг модели - окну, по ходу поиска. */
  onStep: (step: AiSearchStep) => void
}

/** Набранный запрос: разговор вкладки (null - вкладка пуста), область и переключатели поля. */
export type FindRequest = {
  sessionId: string | null
  scope: SearchScope
  query: string
  matchCase: boolean
  wholeWords: boolean
}

type ProjectSearch = { index: SearchIndex; warmUp: NodeJS.Timeout | null }

const EMPTY_COUNTS = { chat: 0, project: 0, conversations: 0 }

/**
 * Поиск по разговорам проектов, как его видит окно: набранный запрос - в индекс (один
 * разговор или все), описанный - модели над разговорами текстом, и отмена её прогона.
 * Индекс - по проекту; первая сборка оплачивается через WARM_UP_DELAY_MS после открытия
 * проекта, в фоне, а не первым нажатием. Закрытый проект уходит из памяти, копия остаётся.
 * В журнал - только события (начался, нашёл N, упал), ни запроса, ни находок.
 */
export class SearchDesk {
  private readonly projects = new Map<string, ProjectSearch>()
  /** Прогоны модели по номеру запроса: отмена помнится с вопроса, а не с процесса. */
  private readonly runs = new AiRuns<AbortController>((controller) => controller.abort())

  constructor(private readonly host: SearchDeskHost) {}

  /** Открытые проекты сменились: новым - сборка с задержкой, закрытые - из памяти. */
  projectsChanged(rootPaths: readonly string[]): void {
    const open = new Set(rootPaths)

    for (const [rootPath, project] of this.projects) {
      if (open.has(rootPath)) continue

      if (project.warmUp) clearTimeout(project.warmUp)

      this.projects.delete(rootPath)
    }

    for (const rootPath of open) {
      if (this.projects.has(rootPath)) continue

      const project = this.projectOf(rootPath)

      project.warmUp = setTimeout(() => {
        project.warmUp = null
        void project.index
          .refresh(true)
          .catch((error: unknown) => console.warn('[claude-search] индекс не собрался:', error))
      }, WARM_UP_DELAY_MS)
    }
  }

  async find(rootPath: string, request: FindRequest): Promise<SearchAnswer> {
    const { index } = this.projectOf(rootPath)

    try {
      const found = await index.find(request.query, {
        conversation: request.sessionId,
        onlyThatChat: request.scope === 'chat',
        limit: HIT_LIMIT,
        matchCase: request.matchCase,
        wholeWords: request.wholeWords,
      })

      return {
        scope: request.scope,
        hits: found.hits.map((hit) => hitOf(index, hit)),
        terms: found.terms,
        counts: { chat: found.chatTotal, project: found.total, conversations: found.conversations },
        total: request.scope === 'chat' ? found.chatTotal : found.total,
        failed: false,
      }
    } catch (error) {
      console.warn('[claude-search] поиск упал:', error)

      return {
        scope: request.scope,
        hits: [],
        terms: [],
        counts: EMPTY_COUNTS,
        total: 0,
        failed: true,
      }
    }
  }

  /**
   * Описанный запрос - модели. Отменённый, пока готовился корпус, не стартует вовсе:
   * стартовав, он работал бы до конца и оплачивался, а ответ никто бы не ждал.
   */
  async ask(rootPath: string, runId: string, query: string): Promise<AiSearchOutcome> {
    const { index } = this.projectOf(rootPath)

    this.runs.asked(runId)

    const corpus = await index.corpus().catch((error: unknown) => {
      console.warn('[claude-search] корпус для модели не записан:', error)

      return null
    })
    const cli = corpus ? await this.host.cli() : null

    if (this.runs.isCancelled(runId)) return this.finish(runId, { status: 'cancelled' })
    if (!corpus) return this.finish(runId, { status: 'failed', reason: 'corpus', detail: '' })
    if (!cli) return this.finish(runId, { status: 'failed', reason: 'cli-not-found', detail: '' })

    const controller = new AbortController()

    this.runs.started(runId, controller)

    const result = await runAiSearch(cli, corpus, query, {
      signal: controller.signal,
      onStep: (step) => {
        if (this.runs.isCancelled(runId)) return

        const subject = step.kind === 'read' ? index.describe(step.subject).title : step.subject

        this.host.onStep({ runId, kind: step.kind, subject })
      },
    })

    if (result.status !== 'found') return this.finish(runId, result)

    // Модель называет сообщение, индекс говорит, что это. Не нашлось - выдумано и никуда не ведёт.
    const hits = result.picks.flatMap((pick) => {
      const message = index.lookup(pick.conversation, pick.uuid)

      return message
        ? [hitOf(index, { message, ...snippetAround(message.text, new Map()) }, pick.reason)]
        : []
    })

    return this.finish(runId, { status: 'found', hits })
  }

  /** Человек нажал Cancel: процесс гасится, а если его ещё нет - он не стартует. */
  cancel(runId: string): void {
    this.runs.cancel(runId)
  }

  /** Выход из IDE: таймеры сборки - прочь, идущие прогоны модели гасит ProcessGroup. */
  dispose(): void {
    for (const project of this.projects.values()) if (project.warmUp) clearTimeout(project.warmUp)

    this.projects.clear()
  }

  /** Итог прогона; отменённый никому не новость - отмена, что бы ни случилось. */
  private finish(runId: string, outcome: AiSearchOutcome): AiSearchOutcome {
    if (this.runs.finished(runId)) return { status: 'cancelled' }

    return outcome
  }

  private projectOf(rootPath: string): ProjectSearch {
    let project = this.projects.get(rootPath)

    if (!project) {
      const index = new SearchIndex(indexDirFor(this.host.dir, rootPath), () =>
        transcriptsOf(rootPath),
      )

      project = { index, warmUp: null }
      this.projects.set(rootPath, project)
    }

    return project
  }
}
