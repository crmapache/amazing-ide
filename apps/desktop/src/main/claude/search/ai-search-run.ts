import type { AiSearchFailure } from '@shared/claude-search'

import { cliHelp } from '../cli/cli-help'
import type { ClaudeCli } from '../cli/cli-locator'
import { runCli } from '../tools/cli-run'
import { maskText } from '../tools/secret-mask'
import type { AiPick, AiStepDraft } from './ai-search'
import { aiStepOf, aiErrorIn, aiSearchArgs, aiSearchBody, parseAiPicks } from './ai-search'
import { AI_TIMEOUT_MS, AI_ERROR_CHARS, AI_MAX_LINE_CHARS } from './ai-search.constants'

export type AiRunResult =
  | { status: 'found'; picks: AiPick[] }
  | { status: 'cancelled' }
  | { status: 'failed'; reason: AiSearchFailure; detail: string }

/** CLI бывает многословен, когда недоволен; в полосе над списком место на одну строку. */
const shortError = (text: string) => {
  const line =
    text
      .split('\n')
      .map((part) => part.trim())
      .find(Boolean) ?? ''
  const masked = maskText(line)

  return masked.length > AI_ERROR_CHARS ? `${masked.slice(0, AI_ERROR_CHARS)}…` : masked
}

/**
 * Поток CLI по мере прихода - в шаги для окна. Хвост недописанной строки ждёт следующего
 * куска: строка, разрезанная посередине, не разбирается.
 */
const stepReader = (onStep: (step: AiStepDraft) => void) => {
  let tail = ''

  return (chunk: string) => {
    tail += chunk

    for (let newline = tail.indexOf('\n'); newline !== -1; newline = tail.indexOf('\n')) {
      const step = aiStepOf(tail.slice(0, newline))

      tail = tail.slice(newline + 1)

      if (step) onStep(step)
    }

    if (tail.length > AI_MAX_LINE_CHARS) tail = ''
  }
}

/**
 * Поиск модели: разовый `claude -p` в папке корпуса (SearchIndex.corpus), а не в проекте -
 * по транскриптам искать нельзя, и в этой папке нет ничего, кроме разговоров текстом. Всё
 * человеческое - на stdin, аргументами только флаги. signal - отмена: группа процессов
 * гасится, итог - cancelled.
 */
export const runAiSearch = async (
  cli: ClaudeCli,
  corpus: string,
  query: string,
  watch: { signal: AbortSignal; onStep: (step: AiStepDraft) => void },
): Promise<AiRunResult> => {
  const args = aiSearchArgs(await cliHelp(cli))

  if (!args) return { status: 'failed', reason: 'outdated', detail: '' }
  if (watch.signal.aborted) return { status: 'cancelled' }

  const run = await runCli(cli, args, corpus, AI_TIMEOUT_MS, aiSearchBody(query, new Date()), {
    signal: watch.signal,
    onStdout: stepReader(watch.onStep),
  })

  if (watch.signal.aborted) return { status: 'cancelled' }
  if (run.timedOut) return { status: 'failed', reason: 'timeout', detail: '' }

  const picks = parseAiPicks(run.stdout)

  if (picks) return { status: 'found', picks }

  // Слова самого CLI, когда они есть (вход, лимит), - важнее наших о форме ответа.
  const said = aiErrorIn(run.stdout)

  if (said) return { status: 'failed', reason: 'failed', detail: shortError(said) }
  if (run.code !== 0) {
    console.warn('[claude-search] поиск модели упал:', run.code, run.stderr.slice(-2000))

    return { status: 'failed', reason: 'failed', detail: shortError(run.stderr) }
  }

  return { status: 'failed', reason: 'answer', detail: '' }
}
