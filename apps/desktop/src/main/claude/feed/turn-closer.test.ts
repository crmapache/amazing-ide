import { it, expect, describe } from 'vitest'

import type { CliMessage } from '../cli/cli-messages'
import { FeedBuilder } from './feed-builder'

const result = (extra: Record<string, unknown> = {}): CliMessage => ({
  type: 'result',
  num_turns: 1,
  result: 'ok',
  ...extra,
})

const turnOf = (builder: FeedBuilder) => builder.items.findLast((item) => item.kind === 'turn')

describe('подпись остановленного хода', () => {
  it('Stop человека - «Stopped by you», без пометки переезда', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.noteStopped()
    builder.finishTurn(result(), true)

    expect(turnOf(builder)).toMatchObject({ interrupted: true })
    expect(turnOf(builder)).not.toHaveProperty('forAccount')
  })

  it('ход, прерванный ради переезда на аккаунт, так и подписан', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.noteStopped('account')
    builder.finishTurn(result(), true)

    expect(turnOf(builder)).toMatchObject({ interrupted: true, forAccount: true })
  })

  it('пометка не переживает ход: следующий Stop - снова человека', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.noteStopped('account')
    builder.finishTurn(result(), true)
    builder.addUserMessage('u2', 'again', [], false)
    builder.finishTurn(result(), true)

    expect(turnOf(builder)).not.toHaveProperty('forAccount')
  })

  it('процесс, снятый посреди хода ради переезда, - отметка с причиной account', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.noteStopped('account')
    builder.abortTurn('interrupted', '')

    expect(builder.items.at(-1)).toMatchObject({ code: 'interrupted', detail: 'account' })
  })
})

describe('строка FAST', () => {
  const init = (reason: string): CliMessage => ({
    type: 'system',
    subtype: 'init',
    fast_mode_state: 'off',
    fast_mode_disabled_reason: reason,
  })
  const fastRows = (builder: FeedBuilder) =>
    builder.items.filter((item) => item.kind === 'notice' && item.code === 'fast')

  it('встаёт заново на каждую новую просьбу, а не раз на причину', () => {
    const builder = new FeedBuilder()

    builder.apply(init('extra_usage_disabled'))
    builder.apply(init('extra_usage_disabled'))
    builder.noteFastAsked()
    builder.apply(init('extra_usage_disabled'))

    expect(fastRows(builder)).toHaveLength(2)
  })
})

describe('строка SETTINGS', () => {
  const settingsRows = (builder: FeedBuilder) =>
    builder.items.filter((item) => item.kind === 'notice' && item.code === 'outranked')

  it('раз на разговор, заново - на новый набор имён; пусто - молчит', () => {
    const builder = new FeedBuilder()

    builder.noteOutranked([])
    builder.noteOutranked(['ANTHROPIC_API_KEY'])
    builder.noteOutranked(['ANTHROPIC_API_KEY'])
    builder.noteOutranked(['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL'])

    expect(settingsRows(builder).map((item) => item.kind === 'notice' && item.detail)).toEqual([
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL',
    ])
  })
})

describe('отказ шлюза из-за параметра выборки', () => {
  it('ошибка хода с кодом 400 и именем поля помечена', () => {
    const builder = new FeedBuilder()
    const said = 'API Error: 400 temperature is deprecated for this model.'

    builder.addUserMessage('u1', 'hi', [], false)
    builder.finishTurn(result({ result: said, is_error: true, api_error_status: 400 }), false)

    expect(builder.items).toContainEqual(
      expect.objectContaining({ kind: 'notice', code: 'cli-error', sampling: true }),
    )
  })

  it('та же ошибка, уже стоящая в ленте, получает пометку, а не второй ряд', () => {
    const builder = new FeedBuilder()
    const said = 'API Error: 400 top_p is not supported'

    builder.addUserMessage('u1', 'hi', [], false)
    builder.addNotice('cli-error', said)
    builder.finishTurn(result({ result: said, is_error: true, api_error_status: 400 }), false)

    const errors = builder.items.filter((item) => item.kind === 'notice')

    expect(errors).toEqual([expect.objectContaining({ detail: said, sampling: true })])
  })

  it('другой отказ - без пометки', () => {
    const builder = new FeedBuilder()

    builder.addUserMessage('u1', 'hi', [], false)
    builder.finishTurn(
      result({
        result: 'API Error: 400 prompt is too long',
        is_error: true,
        api_error_status: 400,
      }),
      false,
    )

    expect(builder.items).not.toContainEqual(expect.objectContaining({ sampling: true }))
  })
})
