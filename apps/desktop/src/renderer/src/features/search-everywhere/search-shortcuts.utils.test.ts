import { it, expect, describe } from 'vitest'

import { cycleTab, tabForShortcut, createDoubleShiftDetector } from './search-shortcuts.utils'

const shift = (type: string, timeStamp: number, repeat = false) => ({
  type,
  key: 'Shift',
  repeat,
  timeStamp,
})

const tap = (detect: ReturnType<typeof createDoubleShiftDetector>, at: number) => {
  detect(shift('keydown', at))

  return detect(shift('keyup', at + 50))
}

describe('createDoubleShiftDetector', () => {
  it('два Shift подряд быстро - срабатывает', () => {
    const detect = createDoubleShiftDetector(400)

    expect(tap(detect, 0)).toBe(false)
    expect(tap(detect, 200)).toBe(true)
  })

  it('медленно - нет, и третий Shift считается первым', () => {
    const detect = createDoubleShiftDetector(400)

    tap(detect, 0)
    expect(tap(detect, 1000)).toBe(false)
    expect(tap(detect, 1200)).toBe(true)
  })

  it('другая клавиша между ними (заглавная буква) сбрасывает счёт', () => {
    const detect = createDoubleShiftDetector(400)

    tap(detect, 0)
    detect(shift('keydown', 100))
    detect({ type: 'keydown', key: 'A', repeat: false, timeStamp: 120 })
    expect(detect(shift('keyup', 150))).toBe(false)
    expect(tap(detect, 200)).toBe(false)
  })

  it('после срабатывания следующий Shift начинает заново', () => {
    const detect = createDoubleShiftDetector(400)

    tap(detect, 0)
    tap(detect, 100)
    expect(tap(detect, 200)).toBe(false)
  })
})

describe('tabForShortcut', () => {
  const stroke = (key: string, code: string, modifiers: Partial<Record<string, boolean>> = {}) => ({
    key,
    code,
    metaKey: true,
    shiftKey: true,
    altKey: false,
    ctrlKey: false,
    ...modifiers,
  })

  it('⌘⇧O, ⌘⇧A, ⌘⇧F - файлы, действия, текст', () => {
    expect(tabForShortcut(stroke('o', 'KeyO'))).toBe('files')
    expect(tabForShortcut(stroke('A', 'KeyA'))).toBe('actions')
    expect(tabForShortcut(stroke('f', 'KeyF'))).toBe('text')
  })

  it('буква - из раскладки (AZERTY), а у нелатинской - по клавише (русская)', () => {
    expect(tabForShortcut(stroke('a', 'KeyQ'))).toBe('actions')
    expect(tabForShortcut(stroke('ф', 'KeyA'))).toBe('actions')
    expect(tabForShortcut(stroke('щ', 'KeyO'))).toBe('files')
  })

  it('без ⌘ или ⇧, с ⌥ или другой буквой - не сочетание поиска', () => {
    expect(tabForShortcut(stroke('o', 'KeyO', { metaKey: false }))).toBeNull()
    expect(tabForShortcut(stroke('o', 'KeyO', { shiftKey: false }))).toBeNull()
    expect(tabForShortcut(stroke('o', 'KeyO', { altKey: true }))).toBeNull()
    expect(tabForShortcut(stroke('p', 'KeyP'))).toBeNull()
  })
})

describe('cycleTab', () => {
  it('вперёд и назад по кругу', () => {
    expect(cycleTab('all', 1)).toBe('files')
    expect(cycleTab('text', 1)).toBe('all')
    expect(cycleTab('all', -1)).toBe('text')
  })
})
