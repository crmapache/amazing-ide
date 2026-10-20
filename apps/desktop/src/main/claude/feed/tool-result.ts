import type { PatchHunk, ToolResult } from '@shared/claude-feed'

import { isRecord, numberField, stringField, recordsField } from '../cli/cli-messages'
import { MAX_PATCH_LINES, MAX_RESULT_CHARS } from './feed.constants'

type Clipped = { text: string; truncated: boolean }

const clip = (text: string): Clipped =>
  text.length > MAX_RESULT_CHARS
    ? { text: text.slice(0, MAX_RESULT_CHARS), truncated: true }
    : { text, truncated: false }

/** Текст результата: строка или блоки, из которых берётся только текст. */
export const resultText = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .filter(isRecord)
    .map((block) => (block['type'] === 'text' ? stringField(block, 'text') : ''))
    .filter(Boolean)
    .join('\n')
}

/** Дифф из `structuredPatch` CLI, не длиннее предела строк на всю правку. */
export const parsePatch = (value: unknown): PatchHunk[] | undefined => {
  if (!Array.isArray(value)) return undefined

  let budget = MAX_PATCH_LINES
  const hunks: PatchHunk[] = []

  for (const hunk of value.filter(isRecord)) {
    const lines = Array.isArray(hunk['lines'])
      ? hunk['lines'].filter((line): line is string => typeof line === 'string')
      : []

    if (budget <= 0) break

    hunks.push({
      oldStart: numberField(hunk, 'oldStart'),
      oldLines: numberField(hunk, 'oldLines'),
      newStart: numberField(hunk, 'newStart'),
      newLines: numberField(hunk, 'newLines'),
      lines: lines.slice(0, budget),
    })
    budget -= lines.length
  }

  return hunks
}

/** Добавленные и удалённые строки по всему диффу CLI, не по обрезанному для показа. */
const countPatch = (value: unknown) => {
  if (!Array.isArray(value)) return undefined

  let added = 0
  let removed = 0

  for (const hunk of value.filter(isRecord)) {
    for (const line of Array.isArray(hunk['lines']) ? hunk['lines'] : []) {
      if (typeof line !== 'string') continue
      if (line.startsWith('+')) added += 1
      if (line.startsWith('-')) removed += 1
    }
  }

  return { added, removed }
}

/**
 * Результат вызова для ленты. Текст - из `tool_result` (его видит модель), структура -
 * из `tool_use_result` (в транскрипте - `toolUseResult`): у Bash там потоки отдельно, у
 * правок - дифф. Длинное обрезается с пометкой.
 */
export const buildToolResult = (
  block: Record<string, unknown>,
  structured: unknown,
): ToolResult => {
  const text = clip(resultText(block['content']))
  const result: ToolResult = {
    text: text.text,
    isError: block['is_error'] === true,
    truncated: text.truncated,
  }

  if (!isRecord(structured)) return result

  if (typeof structured['stdout'] === 'string' || typeof structured['stderr'] === 'string') {
    const stdout = clip(stringField(structured, 'stdout'))
    const stderr = clip(stringField(structured, 'stderr'))

    result.stdout = stdout.text
    result.stderr = stderr.text
    result.truncated = result.truncated || stdout.truncated || stderr.truncated
  }

  const patch = parsePatch(structured['structuredPatch'])

  if (patch && patch.length > 0) result.patch = patch

  const counts = countPatch(structured['structuredPatch'])

  if (counts) result.changeCounts = counts
  if (structured['type'] === 'create') result.created = true

  return result
}

/**
 * Отказ в разрешении или отказ хука: CLI отвечает модели текстом ошибки, а в метаданных
 * пишет, что вызов не выполнялся. Такой вызов в ленте - «отклонён», а не «упал».
 */
export const wasRejected = (message: Record<string, unknown>, toolUseId: string): boolean =>
  recordsField(message, 'tool_result_meta').some(
    (meta) =>
      stringField(meta, 'id') === toolUseId &&
      (stringField(meta, 'non_execution_kind') === 'user-rejected' ||
        stringField(
          isRecord(meta['permission_decision']) ? meta['permission_decision'] : {},
          'decision',
        ) === 'reject'),
  )
