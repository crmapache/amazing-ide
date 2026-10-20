import { it, expect, describe } from 'vitest'

import {
  NO_WATCH,
  sameModel,
  carriesPick,
  watchPicked,
  watchSigned,
  watchRequest,
  watchFellBack,
} from './model-watch'

const on = (model: string) => watchSigned(NO_WATCH, model)[0]

describe('одна модель под разными именами', () => {
  it('метка окна и дата сборки не делают модель другой', () => {
    expect(sameModel('claude-opus-5-5', 'claude-opus-5-5[1m]')).toBe(true)
    expect(sameModel('claude-haiku-4-5-20251001', 'claude-haiku-4-5')).toBe(true)
    expect(sameModel('claude-opus-5-5', 'claude-opus-4-8')).toBe(false)
  })

  it('выбор с поколением сравнивается по поколению, без него - по семье', () => {
    expect(carriesPick('opus[1m]', 'claude-opus-5-5')).toBe(true)
    expect(carriesPick('claude-opus-4-8', 'claude-opus-5-5')).toBe(false)
    expect(carriesPick('opus', 'claude-opus-4-8', 'claude-opus-5-5')).toBe(false)
    expect(carriesPick('default', 'claude-opus-5-5')).toBeNull()
    expect(carriesPick('opusplan', 'claude-sonnet-5')).toBeNull()
  })
})

describe('судьба выбора модели', () => {
  it('первая подпись - не новость', () => {
    expect(watchSigned(NO_WATCH, 'claude-opus-5-5')).toEqual([
      { ...NO_WATCH, streamModel: 'claude-opus-5-5' },
      null,
    ])
  })

  it('выбор того, что уже работает, ждать нечего («1M» держится)', () => {
    const state = watchPicked(on('claude-opus-5-5'), 'opus[1m]', 'claude-opus-5-5[1m]')

    expect(state.ownSwap).toBe(false)
    expect(watchSigned(state, 'claude-opus-5-5')).toEqual([state, null])
  })

  it('подпись покидаемой модели до нового запроса ничего не доказывает', () => {
    const picked = watchPicked(on('claude-opus-5-5'), 'claude-opus-4-8', '')
    const [state, event] = watchSigned(picked, 'claude-opus-5-5')

    expect(event).toBeNull()
    expect(state.ownSwap).toBe(true)
  })

  it('после нового запроса подпись покидаемой - выбор не доехал', () => {
    const due = watchRequest(watchPicked(on('claude-opus-5-5'), 'fable', ''))
    const [state, event] = watchSigned(due, 'claude-opus-5-5')

    expect(event).toEqual({ kind: 'stuck', picked: 'fable', running: 'claude-opus-5-5' })
    expect(state.note).toEqual({ kind: 'stuck', picked: 'fable' })
  })

  it('выбор доехал - тишина и акцент снят', () => {
    const due = watchRequest(watchPicked(on('claude-opus-5-5'), 'claude-opus-4-8', ''))
    const [state, event] = watchSigned(due, 'claude-opus-4-8')

    expect(event).toBeNull()
    expect(state).toMatchObject({ ownSwap: false, note: undefined, streamModel: 'claude-opus-4-8' })
  })

  // Пойман в ACC живьём: Opus 4.8 руками в разговоре на Opus 5.5 читался сменой самим CLI.
  it('выбор другого поколения той же семьи - не смена самим CLI', () => {
    const due = watchRequest(watchPicked(on('claude-opus-5-5'), 'claude-opus-4-8', ''))

    expect(watchSigned(due, 'claude-opus-4-8')[1]).toBeNull()
  })

  it('третья модель без выбора - CLI сменил модель сам', () => {
    const [state, event] = watchSigned(on('claude-opus-5-5'), 'claude-opus-4-8')

    expect(event).toEqual({ kind: 'swap', from: 'claude-opus-5-5', to: 'claude-opus-4-8' })
    expect(state.note).toEqual({ kind: 'swapped', from: 'claude-opus-5-5' })
  })

  it('объявленная смена - акцент без второй строки, следующая подпись молчит', () => {
    const state = watchFellBack(on('claude-opus-5-5'), 'claude-opus-5-5', 'claude-sonnet-5')

    expect(state.note).toEqual({ kind: 'swapped', from: 'claude-opus-5-5' })
    expect(watchSigned(state, 'claude-sonnet-5')[1]).toBeNull()
  })

  it('новый выбор снимает акцент', () => {
    const swapped = watchSigned(on('claude-opus-5-5'), 'claude-opus-4-8')[0]

    expect(watchPicked(swapped, 'opus', '').note).toBeUndefined()
  })
})
