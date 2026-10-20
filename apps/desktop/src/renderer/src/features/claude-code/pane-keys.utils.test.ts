import { it, expect, describe } from 'vitest'

import { nextMode, isModeOff, modeAvailability } from './pane-keys.utils'

describe('Shift+Tab по режимам', () => {
  it('круг терминала, недоступные режимы пропускаются', () => {
    const all = { bypass: true, auto: true }

    expect(nextMode('default', all)).toBe('acceptEdits')
    expect(nextMode('acceptEdits', all)).toBe('plan')
    expect(nextMode('plan', all)).toBe('bypassPermissions')
    expect(nextMode('bypassPermissions', all)).toBe('auto')
    expect(nextMode('auto', all)).toBe('default')
    expect(nextMode('plan', { bypass: false, auto: true })).toBe('auto')
    expect(nextMode('plan', { bypass: false, auto: false })).toBe('default')
  })
})

describe('доступность режимов', () => {
  const none = { bypass: false, autoModels: [] }
  const opus = { model: 'opus', activeModel: null }

  it('bypass - только когда слои его не запрещают и CLI не отказал', () => {
    expect(modeAvailability(none, false, opus).bypass).toBe(true)
    expect(modeAvailability(none, undefined, opus).bypass).toBe(false)
    expect(modeAvailability({ ...none, bypass: true }, false, opus).bypass).toBe(false)
  })

  it('auto - по модели: отказ на другой модели его не гасит', () => {
    const refused = { bypass: false, autoModels: ['haiku'] }

    expect(modeAvailability(refused, false, opus).auto).toBe(true)
    expect(modeAvailability(refused, false, { model: null, activeModel: 'haiku' }).auto).toBe(false)
  })

  it('погашенный в меню - только недоступный необязательный режим', () => {
    const available = { bypass: false, auto: true }

    expect(isModeOff('bypassPermissions', available)).toBe(true)
    expect(isModeOff('auto', available)).toBe(false)
    expect(isModeOff('plan', { bypass: false, auto: false })).toBe(false)
  })
})
