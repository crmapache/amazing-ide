import type { GitChange, GitChangeKind, GitChangeList } from '@shared/git'

import { toWindowPath } from '../fs/project-paths'
import { statusKey, pathAfterFields, FIELDS_BEFORE_PATH } from './git-status-output'
import type { GitScope } from './git-status-output'

/** Переименование или копия ждёт прежний путь: git пишет его следующей записью. */
type PendingMove = { path: string; xy: string; submodule: boolean; modeChanged: boolean }

/** Что ещё известно о строке, кроме пути и вида. */
type ChangeExtras = { origin?: string | null; modeChanged?: boolean }

/**
 * Что значат буквы XY обычной записи для разницы с HEAD (X - индекс, Y - рабочая папка).
 * Добавленный в индекс и удалённый с диска («AD») нет ни в HEAD, ни на диске - сравнивать
 * нечего, такой строки нет. Удалённый где угодно - удалённый; добавленный, в том числе с
 * намерением (`git add -N`, «.A»), - добавленный: в HEAD его нет.
 */
const ordinaryChange = (xy: string): GitChangeKind | null => {
  const [x = '.', y = '.'] = xy

  if (x === 'A' && y === 'D') return null
  if (x === 'D' || y === 'D') return 'deleted'
  if (x === 'A' || y === 'A') return 'added'

  return 'modified'
}

/** Подмодуль (поле `<sub>` начинается с S): его изменение - другой коммит, а не текст файла. */
const isSubmodule = (record: string): boolean => record.split(' ', 3)[2]?.startsWith('S') ?? false

/**
 * Права в HEAD и на диске разные (`chmod +x`, ссылка стала файлом) - поля mH и mW записей
 * «1» и «2». У нового и удалённого одна из сторон - нули, сравнивать не с чем.
 */
const isModeChanged = (record: string): boolean => {
  const [, , , head = '', , worktree = ''] = record.split(' ', 6)

  return head !== worktree && head !== '000000' && worktree !== '000000'
}

/**
 * Разбор `git status --porcelain=v2 -z --untracked-files=all` в список изменений
 * относительно HEAD. Пути у git - от корня репозитория; проект может быть его подпапкой:
 * prefix отрезается, чужие пути выпадают. Регистр путей - как отдал git, без приведения:
 * по ним читаются файлы. Записей больше предела - разбор останавливается, список
 * помечается обрезанным.
 */
export class GitChangesParser {
  private readonly files: GitChange[] = []
  /** Где в списке строка пути: один путь - одна строка. */
  private readonly rows = new Map<string, number>()
  private truncated = false
  private pending: PendingMove | null = null
  private readonly prefix: string

  constructor(
    private readonly scope: GitScope,
    private readonly limit: number,
  ) {
    this.prefix = statusKey(scope.prefix, scope.ignoreCase)
  }

  /** Одна запись. false - предел достигнут, дальше читать незачем. */
  push(record: string): boolean {
    const pending = this.pending

    if (pending) {
      this.pending = null
      this.addMove(pending, record)

      return true
    }

    if (this.files.length >= this.limit) {
      this.truncated = true

      return false
    }

    const kind = record.slice(0, 1)

    // Новая папка целиком приходит путём с «/», только если это чужой репозиторий внутри.
    if (kind === '?') {
      if (!record.endsWith('/')) this.add(record.slice(2), 'untracked')

      return true
    }

    const fields = FIELDS_BEFORE_PATH[kind]
    const path = fields === undefined ? null : pathAfterFields(record, fields)

    if (path === null) return true

    const xy = record.slice(2, 4)
    const submodule = isSubmodule(record)
    const modeChanged = kind !== 'u' && isModeChanged(record)

    if (kind === '2') this.pending = { path, xy, submodule, modeChanged }
    else if (submodule) return true
    else if (kind === 'u') this.add(path, 'conflict')
    else this.add(path, ordinaryChange(xy), { modeChanged })

    return true
  }

  /** Git не успел или его остановили на середине: список не весь. */
  markTruncated(): void {
    this.truncated = true
  }

  result(): GitChangeList {
    return { kind: 'listed', files: this.files, truncated: this.truncated }
  }

  /**
   * Переименованный в индексе - со своим прежним путём (в HEAD файл лежит там). Удалённый
   * с диска после переименования - это удаление прежнего файла. Копия - новый файл:
   * источник никуда не делся.
   */
  private addMove({ path, xy, submodule, modeChanged }: PendingMove, origin: string): void {
    const [x = '.', y = '.'] = xy

    if (submodule) return
    if (y === 'D') return x === 'R' ? this.add(origin, 'deleted') : undefined
    if (x === 'C') return this.add(path, 'added')

    this.add(path, 'renamed', { origin, modeChanged })
  }

  /**
   * Путь из-за пределов проекта не попадает; прежний путь оттуда - и не переименование.
   * Путь уже в списке - строка не дублируется: после `git rm --cached` git отдаёт «удалён в
   * индексе» и «новый» на один путь, а для HEAD и диска это просто изменённый файл.
   */
  private add(rawPath: string, kind: GitChangeKind | null, extras: ChangeExtras = {}): void {
    const path = this.inside(rawPath)

    if (kind === null || path === null) return

    const row = this.rows.get(path)

    if (row !== undefined) {
      if (this.files[row]?.kind === 'deleted' && kind === 'untracked') {
        this.files[row] = { path, kind: 'modified', origin: null }
      }

      return
    }

    const origin = extras.origin == null ? null : this.inside(extras.origin)
    const change: GitChange =
      kind === 'renamed' && origin === null
        ? { path, kind: 'added', origin: null }
        : { path, kind, origin }

    this.rows.set(path, this.files.length)
    this.files.push(extras.modeChanged ? { ...change, modeChanged: true } : change)
  }

  private inside(repoPath: string): string | null {
    if (!statusKey(repoPath, this.scope.ignoreCase).startsWith(this.prefix)) return null

    return toWindowPath(repoPath.slice(this.prefix.length))
  }
}
