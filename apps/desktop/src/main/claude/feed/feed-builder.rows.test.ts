import { it, expect, describe } from 'vitest'

import type { CliMessage } from '../cli/cli-messages'
import { FeedBuilder } from './feed-builder'

/** Часы, которые человек двигает сам: что когда случилось, решает тест. */
const manualClock = () => {
  const clock = { now: 1_000_000, read: () => clock.now }

  return clock
}

const toolUse = (id: string, name = 'Bash', messageId = 'm1'): CliMessage => ({
  type: 'assistant',
  message: { id: messageId, content: [{ type: 'tool_use', id, name, input: {} }] },
  parent_tool_use_id: null,
})

const toolResult = (id: string, extra: Record<string, unknown> = {}): CliMessage => ({
  type: 'user',
  message: { content: [{ type: 'tool_result', tool_use_id: id, content: 'ok' }] },
  ...extra,
})

describe('время вызовов и сообщений', () => {
  it('у вызова из транскрипта - время строк, у живого - часы', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)

    builder.apply({ ...toolUse('t1'), timestamp: '2026-10-01T10:00:00.000Z' }, true)
    builder.apply(toolResult('t1', { timestamp: '2026-10-01T10:00:02.500Z' }), true)

    expect(builder.items[0]).toMatchObject({
      startedAt: Date.parse('2026-10-01T10:00:00.000Z'),
      endedAt: Date.parse('2026-10-01T10:00:02.500Z'),
    })

    builder.apply(toolUse('t2'))
    clock.now += 700
    builder.apply(toolResult('t2'))

    expect(builder.items[1]).toMatchObject({ startedAt: 1_000_000, endedAt: 1_000_700 })
  })

  it('сообщение человека несёт своё время', () => {
    const builder = new FeedBuilder(undefined, () => 42)

    builder.addUserMessage('u1', 'hi', [], false)
    builder.apply(
      { type: 'user', uuid: 'u2', message: { content: 'old' }, timestamp: '2026-10-01T10:00:00Z' },
      true,
    )

    expect(builder.items.map((item) => (item.kind === 'user' ? item.time : 0))).toEqual([
      42,
      Date.parse('2026-10-01T10:00:00Z'),
    ])
  })
})

describe('почему вызов закрыт без результата', () => {
  it('остановка, конец хода, смерть процесса, транскрипт', () => {
    const reasonOf = (finish: (builder: FeedBuilder) => void) => {
      const builder = new FeedBuilder()

      builder.apply(toolUse('t1'))
      finish(builder)

      const item = builder.items[0]

      return item?.kind === 'tool' ? item.closedReason : null
    }
    const result = { type: 'result', num_turns: 1, result: '' }

    expect(reasonOf((builder) => builder.finishTurn(result, true))).toBe('stopped')
    expect(reasonOf((builder) => builder.finishTurn(result, false))).toBe('turnEnded')
    expect(reasonOf((builder) => builder.abortTurn('process-exited', '1'))).toBe('exited')
    expect(reasonOf((builder) => builder.finishReplay())).toBe('replay')
  })
})

describe('время всего запроса', () => {
  it('подпись под ответом - от сообщения до конца работы, без паузы на вопрос', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)

    builder.addUserMessage('u1', 'go', [], false)
    clock.now += 10_000
    builder.work.pause(clock.now)
    clock.now += 60_000
    builder.work.resume(clock.now)
    clock.now += 5_000
    builder.finishTurn({ type: 'result', num_turns: 2, result: 'ok', duration_ms: 3_000 }, false)

    expect(builder.items.at(-1)).toMatchObject({ kind: 'turn', durationMs: 15_000 })
  })

  it('пока работает фоновый агент, ход подписан цифрой CLI', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)

    builder.addUserMessage('u1', 'go', [], false)
    builder.apply(toolUse('a1', 'Agent'))
    builder.apply({
      type: 'user',
      message: {
        content: [
          { type: 'tool_result', tool_use_id: 'a1', content: 'Async agent launched successfully.' },
        ],
      },
    })
    clock.now += 40_000
    builder.finishTurn({ type: 'result', num_turns: 1, result: 'ok', duration_ms: 2_000 }, false)

    expect(builder.items.at(-1)).toMatchObject({ kind: 'turn', durationMs: 2_000 })
  })
})

describe('служебные строки', () => {
  it('компакт: живая карточка, потом цифры до и после', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)

    builder.apply({ type: 'system', subtype: 'status', status: 'compacting' })

    expect(builder.items[0]).toMatchObject({ kind: 'compact', pending: true, startedAt: 1_000_000 })

    builder.apply({
      type: 'system',
      subtype: 'compact_boundary',
      compact_metadata: {
        trigger: 'manual',
        pre_tokens: 51_200,
        post_tokens: 5_800,
        duration_ms: 40_000,
      },
    })

    expect(builder.items).toHaveLength(1)
    expect(builder.items[0]).toMatchObject({
      pending: false,
      trigger: 'manual',
      preTokens: 51_200,
      postTokens: 5_800,
      durationMs: 40_000,
    })
  })

  it('компакт из транскрипта - camelCase', () => {
    const builder = new FeedBuilder()

    builder.apply(
      {
        type: 'system',
        subtype: 'compact_boundary',
        compactMetadata: { trigger: 'auto', preTokens: 877_137, durationMs: 93_031 },
      },
      true,
    )

    expect(builder.items[0]).toMatchObject({ kind: 'compact', trigger: 'auto', preTokens: 877_137 })
  })

  it('повтор: попытки на одной строке, итог - по следующей строке', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)
    const retry = (attempt: number): CliMessage => ({
      type: 'system',
      subtype: 'api_retry',
      attempt,
      max_retries: 10,
      retry_delay_ms: 30_000,
      error_status: 529,
    })

    builder.apply(retry(1))
    builder.apply(retry(2))

    expect(builder.items).toHaveLength(1)
    expect(builder.items[0]).toMatchObject({ kind: 'retry', reason: 'overloaded', attempt: 2 })

    clock.now += 31_000
    builder.apply({ type: 'assistant', message: { id: 'm', model: 'x', content: [] } })

    expect(builder.items[0]).toMatchObject({ pending: false, outcome: 'recovered' })
  })

  it('быстро прошедший повтор следа не оставляет', () => {
    const builder = new FeedBuilder()

    builder.apply({ type: 'system', subtype: 'api_retry', attempt: 1, error_status: 500 })
    builder.apply({ type: 'assistant', message: { id: 'm', model: 'x', content: [] } })

    expect(builder.items).toEqual([])
  })

  it('смена модели самим CLI и лимит - по строке, повтор лимита - мимо', () => {
    const clock = manualClock()
    const builder = new FeedBuilder(undefined, clock.read)
    const limit: CliMessage = {
      type: 'rate_limit_event',
      rate_limit_info: { status: 'rejected', resetsAt: 2_000, rateLimitType: 'five_hour' },
    }

    builder.apply({
      type: 'system',
      subtype: 'model_refusal_fallback',
      originalModel: 'claude-opus-5',
      fallbackModel: 'claude-sonnet-5',
      content: 'Safeguards flagged the message',
    })
    builder.apply(limit)
    builder.apply(limit)
    builder.apply({ type: 'rate_limit_event', rate_limit_info: { status: 'allowed' } })

    expect(builder.items.map((item) => item.kind)).toEqual(['model', 'limit'])
    expect(builder.items[1]).toMatchObject({
      state: 'limit',
      window: 'five_hour',
      resetsAt: 2_000_000,
    })
  })

  it('быстрый режим: отказ с причиной - строка, повтор той же - нет', () => {
    const builder = new FeedBuilder()
    const init = (reason: string): CliMessage => ({
      type: 'system',
      subtype: 'init',
      fast_mode_state: 'off',
      fast_mode_disabled_reason: reason,
    })

    builder.apply(init('sdk_opt_in_required'))
    builder.apply(init('extra_usage_disabled'))
    builder.apply(init('extra_usage_disabled'))

    expect(builder.items).toEqual([
      expect.objectContaining({ kind: 'notice', code: 'fast', detail: 'extra_usage_disabled' }),
    ])
  })

  it('/clear: лента начинается с отметки', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.drain()
    builder.apply({ type: 'conversation_reset', new_conversation_id: 's2' })

    const changes = builder.drain()

    expect(builder.items).toEqual([expect.objectContaining({ kind: 'notice', code: 'cleared' })])
    expect(changes.removes).toContain('u1')
  })

  it('ошибка, которую уже сказал ответ модели, второй раз не встаёт', () => {
    const builder = new FeedBuilder()

    builder.apply({
      type: 'assistant',
      error: 'rate_limit',
      message: { content: [{ type: 'text', text: 'You hit your limit' }] },
    })
    builder.finishTurn(
      { type: 'result', num_turns: 1, result: 'You hit your limit', is_error: true },
      false,
    )

    expect(builder.items.filter((item) => item.kind === 'notice')).toHaveLength(1)
  })
})

describe('транскрипт и страницы', () => {
  it('у ответа один id вживую и в транскрипте', () => {
    const live = new FeedBuilder()
    const stream = (event: Record<string, unknown>): CliMessage => ({
      type: 'stream_event',
      event,
      parent_tool_use_id: null,
    })

    live.apply(stream({ type: 'message_start', message: { id: 'm1' } }))
    live.apply(
      stream({ type: 'content_block_start', index: 0, content_block: { type: 'thinking' } }),
    )
    live.apply(stream({ type: 'content_block_start', index: 1, content_block: { type: 'text' } }))
    live.apply(
      stream({ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Hi' } }),
    )

    const replay = new FeedBuilder()

    replay.apply(
      { type: 'assistant', message: { id: 'm1', content: [{ type: 'thinking', thinking: 'x' }] } },
      true,
    )
    replay.apply(
      { type: 'assistant', message: { id: 'm1', content: [{ type: 'text', text: 'Hi' }] } },
      true,
    )

    const answerId = (builder: FeedBuilder) =>
      builder.items.find((item) => item.kind === 'assistant')?.id

    expect(answerId(replay)).toBe(answerId(live))
  })

  it('страница выше встаёт перед лентой и забирает результаты своих вызовов', () => {
    const builder = new FeedBuilder()

    builder.apply(toolResult('t1'), true)
    builder.apply({ type: 'user', uuid: 'u2', message: { content: 'later' } }, true)
    builder.finishReplay()
    builder.prependReplay([
      { type: 'user', uuid: 'u1', message: { content: 'first' } },
      toolUse('t1'),
    ])

    expect(builder.items.map((item) => item.id)).toEqual(['u1', 't1', 'u2'])
    expect(builder.items[1]).toMatchObject({ status: 'done', result: { text: 'ok' } })
  })

  it('разговор, оборванный на вопросе, - вопрос и модель запоминаются', () => {
    const builder = new FeedBuilder()

    builder.apply(
      {
        type: 'assistant',
        message: {
          id: 'm1',
          model: 'claude-opus-5',
          content: [{ type: 'tool_use', id: 'q1', name: 'AskUserQuestion', input: {} }],
        },
      },
      true,
    )
    builder.finishReplay()

    expect(builder.replayFacts.model).toBe('claude-opus-5')
    expect(builder.replayFacts.abandonedQuestion?.id).toBe('q1')
  })
})
