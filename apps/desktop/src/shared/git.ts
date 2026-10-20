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

/**
 * Свой статус файла в git - цвет имени в дереве, как в WebStorm: изменён, добавлен в
 * индекс, не добавлен в git, игнорируется, конфликт слияния. Удалённых в дереве нет.
 */
export type GitPathStatus = 'modified' | 'added' | 'untracked' | 'ignored' | 'conflict'

/** Папка, внутри которой есть изменения: conflict - если среди них конфликт. */
export type GitFolderChange = 'modified' | 'conflict'

/**
 * Статусы проекта по git. Пути - от корня проекта через «/», в NFC, как в дереве. Папка
 * целиком новая или игнорируемая - одной записью в folders (корень проекта - пустой
 * строкой): статус у неё и у всего, что внутри. truncated - записей больше предела или
 * git не успел: у части строк цвета нет. ignoreCase - репозиторий не различает регистр
 * (core.ignorecase, обычное дело на macOS): ключи в нижнем регистре, искать - так же,
 * иначе папка, переименованная только регистром, теряла бы цвета.
 */
export type GitStatus = {
  files: Record<string, GitPathStatus>
  folders: Record<string, 'untracked' | 'ignored'>
  changedFolders: Record<string, GitFolderChange>
  truncated: boolean
  ignoreCase: boolean
}
