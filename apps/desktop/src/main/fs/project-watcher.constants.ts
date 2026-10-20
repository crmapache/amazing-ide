/**
 * Тишина, после которой пачка событий слежения уходит дальше. Сохранение файла - это
 * несколько событий подряд (временный файл, переименование), окну нужна одна весть.
 */
export const WATCH_QUIET_MS = 150

/** Дольше пачка не копится, даже если события идут без перерыва (pnpm install). */
export const WATCH_MAX_DELAY_MS = 1_000

/**
 * Больше путей в одной пачке не перечисляем: проще сказать окну «перечитай всё», чем
 * гнать через IPC тысячи путей после смены ветки.
 */
export const WATCH_PATHS_LIMIT = 200

/**
 * Что в .git меняет статус или ветку: HEAD, индекс, ссылки, правила исключений, слияние
 * и rebase в процессе, настройки. Остальное там пишется постоянно и без толку для нас:
 * объекты и журналы при fetch, куки демона fsmonitor на каждый git status (без этого
 * списка чтение статуса будило бы само себя), чужие worktree и LFS. Пустая строка - сама
 * папка .git: появилась после git init или пропала.
 */
export const GIT_DIR_FILES: ReadonlySet<string> = new Set([
  '',
  'HEAD',
  'index',
  'packed-refs',
  'config',
  'info/exclude',
  'MERGE_HEAD',
  'CHERRY_PICK_HEAD',
  'REVERT_HEAD',
])

export const GIT_DIR_FOLDERS: readonly string[] = ['refs/', 'rebase-merge/', 'rebase-apply/']

/** HEAD и индекс подмодуля: от них зависит, изменён ли подмодуль в статусе проекта. */
export const GIT_SUBMODULE_STATE = /^modules\/.+\/(?:HEAD|index)$/
