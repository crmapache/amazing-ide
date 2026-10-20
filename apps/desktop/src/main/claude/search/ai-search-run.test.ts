import { rm, chmod, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { it, expect, describe, afterEach, beforeEach } from 'vitest'

import { parseCliFeatures } from '../cli/cli-features'
import type { ClaudeCli } from '../cli/cli-locator'
import type { AiStepDraft } from './ai-search'
import { runAiSearch } from './ai-search-run'

let dir = ''

/** Поддельный CLI: справка с --tools, шаг Grep сразу, итог - через pause секунд. */
const fakeCli = async (pause: number, result: string): Promise<ClaudeCli> => {
  const binary = join(dir, `claude-${pause}`)
  const step = JSON.stringify({
    type: 'assistant',
    message: {
      content: [{ type: 'tool_use', id: 't', name: 'Grep', input: { pattern: 'balance' } }],
    },
  })

  await writeFile(
    binary,
    [
      '#!/bin/sh',
      'if [ "$1" = "--help" ]; then echo "--tools --model --effort --output-format"; exit 0; fi',
      'cat > /dev/null',
      `echo '${step}'`,
      `sleep ${pause}`,
      `echo '${result}'`,
    ].join('\n'),
  )
  await chmod(binary, 0o755)

  return { binary, env: { PATH: process.env['PATH'] ?? '' }, features: parseCliFeatures('') }
}

const resultLine = (text: string) =>
  JSON.stringify({ type: 'result', is_error: false, result: text })

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'claude-ask-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('прогон модели', () => {
  it('шаги приходят по ходу, находки - из итога', async () => {
    const cli = await fakeCli(
      0,
      resultLine('{"hits":[{"conversationId":"c1","uuid":"u1","reason":"why"}]}'),
    )
    const steps: AiStepDraft[] = []
    const result = await runAiSearch(cli, dir, 'balance', {
      signal: new AbortController().signal,
      onStep: (step) => steps.push(step),
    })

    expect(steps).toEqual([{ kind: 'grep', subject: 'balance' }])
    expect(result).toEqual({
      status: 'found',
      picks: [{ conversation: 'c1', uuid: 'u1', reason: 'why' }],
    })
  })

  it('отмена гасит процесс, итог - отменён', async () => {
    const cli = await fakeCli(5, resultLine('{"hits":[]}'))
    const controller = new AbortController()
    const started = Date.now()
    const result = await runAiSearch(cli, dir, 'balance', {
      signal: controller.signal,
      onStep: () => controller.abort(),
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(Date.now() - started).toBeLessThan(4_000)
  })

  it('проза вместо списка - провал ответа, ошибка CLI - его словами', async () => {
    const prose = await fakeCli(0, resultLine('I could not find it.'))

    expect(
      await runAiSearch(prose, dir, 'x', {
        signal: new AbortController().signal,
        onStep: () => undefined,
      }),
    ).toEqual({
      status: 'failed',
      reason: 'answer',
      detail: '',
    })

    const failed = await fakeCli(
      0,
      JSON.stringify({ type: 'result', is_error: true, result: 'Not logged in' }),
    )

    expect(
      await runAiSearch(failed, dir, 'x', {
        signal: new AbortController().signal,
        onStep: () => undefined,
      }),
    ).toEqual({
      status: 'failed',
      reason: 'failed',
      detail: 'Not logged in',
    })
  })
})
