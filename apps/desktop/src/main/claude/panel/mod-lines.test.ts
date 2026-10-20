import { it, expect, describe } from 'vitest'

import { foldModLine, withoutToast, isModQuestion } from './mod-lines'

/** Строки - как их записал CLI 2.1.293 в сессии с модом (замер ACC, id сокращены). */
const STATUS = {
  type: 'system',
  subtype: 'ui_status',
  plugin: 'probe',
  text: '3 passing',
  uuid: 'u',
  session_id: 's',
}
const PANES = {
  type: 'system',
  subtype: 'ui_panes',
  panes: [{ id: 'blast-radius', title: 'Blast Radius', plugin: 'blast-radius', rows: 12 }],
  shown_id: 'blast-radius',
  focused_id: null,
}
const TOAST = {
  type: 'system',
  subtype: 'ui_toast',
  plugin: 'probe',
  text: 'done',
  timeout_ms: 4000,
}
const LOG = { type: 'system', subtype: 'ui_log', plugin: 'probe', text: 'build finished' }

describe('строки модов', () => {
  it('статус и открытые окна - состояние, последнее значение', () => {
    const withStatus = foldModLine(undefined, STATUS, 0)?.mods
    const withPanes = foldModLine(withStatus, PANES, 0)?.mods

    expect(withPanes).toEqual({
      status: { probe: '3 passing' },
      panes: [{ id: 'blast-radius', title: 'Blast Radius', plugin: 'blast-radius' }],
      toast: null,
    })
  })

  it('пустой статус и пустой список окон снимают своё, пустое состояние - не состояние', () => {
    const mods = foldModLine(undefined, STATUS, 0)?.mods
    const cleared = foldModLine(mods, { ...STATUS, text: null }, 0)

    expect(cleared?.mods).toBeUndefined()
    expect(foldModLine(undefined, { ...PANES, panes: [] }, 0)?.mods).toBeUndefined()
  })

  it('всплывашка живёт свой срок, по умолчанию четыре секунды', () => {
    expect(foldModLine(undefined, TOAST, 100)?.mods?.toast).toEqual({
      plugin: 'probe',
      text: 'done',
      until: 4100,
    })
    expect(foldModLine(undefined, { ...TOAST, timeout_ms: 0 }, 0)?.mods?.toast?.until).toBe(4000)
  })

  it('отжившая всплывашка уходит, а с ней и пустое состояние', () => {
    const toasted = foldModLine(undefined, TOAST, 100)?.mods
    const withStatus = foldModLine(toasted, STATUS, 100)?.mods

    expect(withoutToast(toasted, 5000)).toBeUndefined()
    expect(withoutToast(toasted, 200)).toBe(toasted)
    expect(withoutToast(withStatus, 5000)?.status).toEqual({ probe: '3 passing' })
  })

  it('строка лога - в ленту, состояние не трогает', () => {
    expect(foldModLine(undefined, LOG, 0)).toEqual({
      mods: undefined,
      log: { plugin: 'probe', text: 'build finished' },
    })
  })

  it('перерисовка и прочее для поверхности выбрасываются', () => {
    const redraw = { type: 'system', subtype: 'ui_invalidate', event: 'ui.render' }

    expect(foldModLine(undefined, redraw, 0)).toEqual({ mods: undefined, log: null })
  })

  // Замок на всех остальных: ни одна строка обычного разговора не принята за строку мода.
  it('строки обычного разговора - не строки мода', () => {
    const ordinary = [
      { type: 'system', subtype: 'init', slash_commands: ['compact'] },
      { type: 'system', subtype: 'status', status: 'requesting' },
      { type: 'system', subtype: 'commands_changed', commands: [] },
      { type: 'system', subtype: 'control_request_progress', request_id: 'r' },
      { type: 'result', subtype: 'ui_status', result: 'x' },
      { type: 'assistant', message: { content: [{ type: 'text', text: '"subtype":"ui_toast"' }] } },
    ]

    for (const line of ordinary) expect(foldModLine(undefined, line, 0)).toBeNull()
  })

  it('вопрос мода узнаётся по номеру, который даёт CLI', () => {
    expect(isModQuestion('toolu_plugin_db08f9b6417f4de8a6f8d1c033266501')).toBe(true)
    expect(isModQuestion('toolu_01ABCDEFGHIJKLMNOPQRSTUV')).toBe(false)
    expect(isModQuestion('toolu_vrtx_01ABCDEFGHIJ')).toBe(false)
  })
})
