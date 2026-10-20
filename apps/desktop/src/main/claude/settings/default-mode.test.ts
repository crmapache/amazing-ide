import { it, expect, describe } from 'vitest'

import type { ModeSettings } from './default-mode'
import { pickDefaultMode } from './default-mode'

const from = (source: ModeSettings['source'], defaultMode: unknown, bypassDisabled = false) => ({
  source,
  defaultMode,
  bypassDisabled,
})

describe('режим нового разговора', () => {
  it('репозиторий не может снять вопросы', () => {
    expect(pickDefaultMode([from('project', 'bypassPermissions')])).toBe('default')
    expect(pickDefaultMode([from('project', 'auto')])).toBe('default')
    expect(pickDefaultMode([from('project', 'dontAsk')])).toBe('default')
  })

  it('репозиторий может выбрать режим со спросом', () => {
    expect(pickDefaultMode([from('project', 'plan'), from('user', 'auto')])).toBe('plan')
    expect(pickDefaultMode([from('project', 'manual')])).toBe('default')
  })

  it('auto - от человека или организации', () => {
    expect(pickDefaultMode([from('user', 'auto')])).toBe('auto')
    expect(pickDefaultMode([from('managed', 'auto')])).toBe('auto')
  })

  it('bypass - только от человека и если его нигде не запретили', () => {
    expect(pickDefaultMode([from('user', 'bypassPermissions')])).toBe('bypassPermissions')
    expect(pickDefaultMode([from('managed', 'bypassPermissions')])).toBe('default')
    expect(
      pickDefaultMode([from('project', undefined, true), from('user', 'bypassPermissions')]),
    ).toBe('default')
  })

  it('непонятный режим пропускается, а не ломает выбор', () => {
    expect(pickDefaultMode([from('user', 'yolo'), from('user', 'acceptEdits')])).toBe('acceptEdits')
    expect(pickDefaultMode([])).toBe('default')
  })
})
