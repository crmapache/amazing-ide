import type { WorkspaceState } from './workspace'

/** На чём сейчас стоит репозиторий проекта. */
export type GitHead =
  | { kind: 'branch'; name: string }
  /** HEAD не на ветке: показываем короткий хеш коммита. */
  | { kind: 'detached'; commit: string }

/** Ветки репозитория: локальные и удалённые (origin/main), по алфавиту. */
export type GitBranches = { local: string[]; remote: string[] }

export type GitBranchKind = 'local' | 'remote'

/**
 * Итог действия git. Не получилось - details: что сказал git (по-английски, как
 * есть). Это вывод внешней программы, а не текст интерфейса, поэтому без перевода.
 * summary - первая строка ответа при успехе («Already up to date.»).
 */
export type GitActionResult = { ok: true; summary: string } | { ok: false; details: string }

/** Что уйдёт при push: ветка, куда и сколько коммитов. */
export type GitPushInfo = {
  branch: string
  /** origin/main. null - у ветки нет upstream, push её опубликует. */
  upstream: string | null
  /** Куда публиковать ветку без upstream. null - удалённых репозиториев нет. */
  remote: string | null
  /** Сколько коммитов впереди upstream. null - upstream нет. */
  ahead: number | null
}

/** Состояние PR: черновик - отдельно от открытого, у GitHub это флаг, а не состояние. */
export type GitPullRequestState = 'open' | 'draft' | 'merged' | 'closed'

/** Pull request текущей ветки на GitHub: номер, адрес страницы и состояние. */
export type GitPullRequest = { number: number; url: string; state: GitPullRequestState }

/** Клонирование: получилось - новый набор проектов (клон уже открыт вкладкой). */
export type GitCloneResult = { ok: true; state: WorkspaceState } | { ok: false; details: string }
