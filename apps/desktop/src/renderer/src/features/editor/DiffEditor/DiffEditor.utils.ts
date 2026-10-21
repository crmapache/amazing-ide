import type { GitChange, GitHeadFile } from '@shared/git'

import type { DocumentStatus } from '../editor.types'
import type { DiffNote, DiffState, DiffSummary, ChangeNeighbours } from './DiffEditor.types'

/**
 * Где файл лежит в последнем коммите: у переименованного - по прежнему пути, у нового (в
 * индексе или вне git) его там нет - null, левая сторона пуста. Файла нет в списке
 * изменений (откатили, закоммитили) - тот же путь: разница честно покажет «без изменений».
 */
export const headPathOf = (change: GitChange | null, path: string): string | null =>
  change?.kind === 'added' || change?.kind === 'untracked' ? null : (change?.origin ?? path)

/**
 * Что показать: обе стороны готовы - разницу; какая-то не текст - почему; иначе ждать.
 * Сначала - то, что не показать вовсе: тогда ждать вторую сторону незачем. Файла нет на
 * диске - по списку изменений (удалён) или по самому диску (удалили, пока разница открыта;
 * закоммитили удаление) - правая сторона пуста и не правится.
 */
export const diffState = ({
  change,
  hasHead,
  head,
  status,
}: {
  change: GitChange | null
  hasHead: boolean
  head: GitHeadFile | undefined
  status: DocumentStatus
}): DiffState => {
  const isDeleted = change?.kind === 'deleted' || status.kind === 'missing'

  if (!isDeleted && status.kind !== 'text' && status.kind !== 'loading') {
    return { kind: 'fileProblem', status }
  }

  if (hasHead && head && head.kind !== 'text' && head.kind !== 'missing') {
    return { kind: 'headProblem', file: head }
  }

  if ((hasHead && !head) || (!isDeleted && status.kind === 'loading')) return { kind: 'loading' }

  return {
    kind: 'ready',
    original: head?.kind === 'text' ? head.text : '',
    modified: isDeleted ? 'empty' : 'document',
    readOnly: isDeleted || (status.kind === 'text' && status.readOnly),
  }
}

/** Соседи файла в списке изменений (порядок списка - порядок git); нет в списке - соседей нет. */
export const neighbourChanges = (
  files: readonly GitChange[] | undefined,
  path: string,
): ChangeNeighbours => {
  const index = files?.findIndex((change) => change.path === path) ?? -1

  if (!files || index < 0) return { previous: null, next: null }

  return { previous: files[index - 1] ?? null, next: files[index + 1] ?? null }
}

/**
 * Что поменялось, кроме строк: переводы строк (их видит Monaco по моделям), метка порядка
 * байтов (с текста её снимают с обеих сторон, поэтому сравнивается признак), права файла (из
 * списка изменений).
 */
export const diffNotes = ({
  change,
  head,
  status,
  eolChanged,
}: {
  change: GitChange | null
  head: GitHeadFile | undefined
  status: DocumentStatus
  eolChanged: boolean
}): DiffNote[] => {
  const bomChanged = head?.kind === 'text' && status.kind === 'text' && head.bom !== status.bom
  const notes: [DiffNote, boolean][] = [
    ['eol', eolChanged],
    ['bom', bomChanged],
    ['mode', change?.modeChanged === true],
  ]

  return notes.filter(([, changed]) => changed).map(([note]) => note)
}

/**
 * Подпись счёта над разницей. Monaco сравнивает строки без концов и без метки BOM, а права
 * файла не видит вовсе: файл из списка изменений с нулём различий должен сказать, что же в
 * нём поменялось, а не «различий нет».
 */
export const diffSummary = ({
  isCounting,
  count,
  notes,
}: {
  isCounting: boolean
  count: number | null
  notes: readonly DiffNote[]
}): DiffSummary => {
  if (isCounting) return { key: 'counting', count: 0, notes }
  if (count === null) return { key: 'none', count: 0, notes }
  if (count > 0) return { key: 'differences', count, notes }

  return { key: notes.length > 0 ? 'noTextDifferences' : 'noDifferences', count: 0, notes }
}
