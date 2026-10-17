import type { ByteRecord } from './record-reader'
import { GIT_GITLINK_MODE, GIT_SYMLINK_MODE } from './search.constants'

/**
 * Что делать с путём из `git ls-files`: file - точно файл; unverified - надо
 * проверить на диске (ссылка может вести на каталог); removed - удалён с диска,
 * хотя ещё в индексе.
 */
export type GitPathEntry = { path: string; kind: 'file' | 'unverified' | 'removed' }

/** Строка проекта, где git grep нашёл совпадение. clipped - текст строки обрезан. */
export type GrepHit = { relativePath: string; line: number; text: string; clipped: boolean }

/**
 * Запись `git ls-files -z -t -s --cached --deleted`: «метка режим хэш стадия\tпуть».
 * Удалённый с диска файл приходит дважды: H, следом R - вторая запись его вычёркивает.
 * Пропускаются подмодули (это каталоги) и sparse checkout (S: файла нет на диске).
 */
export const parseTrackedEntry = (record: string): GitPathEntry | null => {
  const tab = record.indexOf('\t')

  if (tab === -1) return null

  const [tag, mode] = record.slice(0, tab).split(' ')
  const path = record.slice(tab + 1)

  if (path === '') return null
  if (tag === 'R') return { path, kind: 'removed' }
  if (tag === 'S' || mode === GIT_GITLINK_MODE) return null

  return { path, kind: mode === GIT_SYMLINK_MODE ? 'unverified' : 'file' }
}

/**
 * Запись `git ls-files -z --others`. Вложенный репозиторий git отдаёт каталогом со
 * «/» на конце - это не файл. Остальное проверяется на диске: неотслеживаемая
 * ссылка на каталог выглядит так же, как файл.
 */
export const parseUntrackedEntry = (record: string): GitPathEntry | null =>
  record === '' || record.endsWith('/') ? null : { path: record, kind: 'unverified' }

/** Запись `git grep -z -n` из трёх полей. Неожиданный формат - null, а не догадка. */
export const parseGrepRecord = ({ fields, clipped }: ByteRecord): GrepHit | null => {
  const [relativePath, lineField, text] = fields
  const line = Number(lineField)

  if (!relativePath || text === undefined || !Number.isInteger(line) || line < 1) return null

  return { relativePath, line, text, clipped }
}
