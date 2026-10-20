import { structuredPatch } from 'diff'

import type { PatchHunk, ToolInput, ToolFeedItem } from '@shared/claude-feed'

import { inputText } from './claude.utils'

/** Строка диффа для отрисовки: добавлена, удалена, контекст или разрыв между кусками. */
export type DiffRow = {
  kind: 'add' | 'del' | 'ctx' | 'gap'
  text: string
  /** Номер строки в файле после правки (у удалённой - до правки). null - не знаем. */
  line: number | null
}

/** Сколько контекста вокруг правки, когда дифф считаем сами. */
const CONTEXT_LINES = 2

/** Строки диффа из кусков: номера идут от начала каждого куска. */
export const rowsFromPatch = (hunks: readonly PatchHunk[], numbered: boolean): DiffRow[] => {
  const rows: DiffRow[] = []

  hunks.forEach((hunk, index) => {
    if (index > 0) rows.push({ kind: 'gap', text: '', line: null })

    let oldLine = hunk.oldStart
    let newLine = hunk.newStart

    for (const raw of hunk.lines) {
      const sign = raw[0]
      const text = raw.slice(1)

      if (sign === '+') {
        rows.push({ kind: 'add', text, line: numbered ? newLine : null })
        newLine += 1
      } else if (sign === '-') {
        rows.push({ kind: 'del', text, line: numbered ? oldLine : null })
        oldLine += 1
      } else if (sign === ' ') {
        rows.push({ kind: 'ctx', text, line: numbered ? newLine : null })
        oldLine += 1
        newLine += 1
      }
    }
  })

  return rows
}

const text = inputText

const hunksOf = (before: string, after: string): PatchHunk[] =>
  structuredPatch('', '', before, after, '', '', { context: CONTEXT_LINES }).hunks

/**
 * Дифф правки по входу вызова - пока CLI не прислал свой (карточка разрешения, ход
 * прерван). Номеров строк файла тут нет: известны только заменяемые куски.
 */
export const patchFromInput = (name: string, input: ToolInput): PatchHunk[] => {
  if (name === 'Write') return hunksOf('', text(input, 'content'))
  if (name === 'Edit') return hunksOf(text(input, 'old_string'), text(input, 'new_string'))

  if (name === 'MultiEdit' && Array.isArray(input['edits'])) {
    return input['edits'].flatMap((edit: unknown) =>
      typeof edit === 'object' && edit !== null
        ? hunksOf(text(edit as ToolInput, 'old_string'), text(edit as ToolInput, 'new_string'))
        : [],
    )
  }

  return []
}

/** Сколько строк добавлено и удалено. */
export const diffStats = (rows: readonly DiffRow[]) => ({
  added: rows.filter((row) => row.kind === 'add').length,
  removed: rows.filter((row) => row.kind === 'del').length,
})

/**
 * Строки диффа правки: дифф CLI с настоящими номерами строк, если он пришёл, иначе -
 * свой по входу вызова (вопрос разрешения, прерванный ход). Новый файл (Write)
 * начинается с первой строки, его номера точные и без CLI.
 */
export const editRows = (tool: Pick<ToolFeedItem, 'name' | 'input' | 'result'>): DiffRow[] => {
  const patch = tool.result?.patch

  if (patch && patch.length > 0) return rowsFromPatch(patch, true)

  return rowsFromPatch(patchFromInput(tool.name, tool.input), tool.name === 'Write')
}

/** Кусок диффа для показа: с какой строки (после правки), сколько добавлено и удалено, строки. */
export type DiffHunk = { start: number | null; added: number; removed: number; rows: DiffRow[] }

/** Строки диффа - кусками по разрывам; шапка куска - номер его первой строки. */
export const hunksOfRows = (rows: readonly DiffRow[]): DiffHunk[] => {
  const hunks: DiffHunk[] = []
  let current: DiffRow[] = []

  const close = () => {
    if (current.length === 0) return

    const first = current.find((row) => row.kind !== 'del') ?? current[0]

    hunks.push({ start: first?.line ?? null, ...diffStats(current), rows: current })
    current = []
  }

  for (const row of rows) {
    if (row.kind === 'gap') close()
    else current.push(row)
  }

  close()

  return hunks
}

/**
 * Первые limit строк диффа по кускам и сколько осталось. Дифф чуть длиннее предела
 * (до slack) показывается целиком: прятать три строки ради подписи «ещё 3» - лишний клик.
 */
export const trimHunks = (
  hunks: readonly DiffHunk[],
  limit: number,
  slack: number,
): { hunks: DiffHunk[]; hidden: number } => {
  const total = hunks.reduce((sum, hunk) => sum + hunk.rows.length, 0)

  if (total <= limit + slack) return { hunks: [...hunks], hidden: 0 }

  const shown: DiffHunk[] = []
  let room = limit

  for (const hunk of hunks) {
    if (room <= 0) break

    shown.push(hunk.rows.length <= room ? hunk : { ...hunk, rows: hunk.rows.slice(0, room) })
    room -= hunk.rows.length
  }

  return { hunks: shown, hidden: total - limit }
}
