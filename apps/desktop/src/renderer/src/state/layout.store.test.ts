import { it, expect, describe, beforeEach } from 'vitest'

import { isMainShown, useLayoutStore } from './layout.store'

beforeEach(() =>
  useLayoutStore.setState({
    side: { activeViewId: 'files', isOpen: true, width: 280 },
    main: { activeViewId: 'file', isOpen: true },
    provider: { activeViewId: 'claude-code', isOpen: true, width: 520 },
    room: 1252,
  }),
)

describe('середина, которой не хватает места', () => {
  it('сворачивается сама, когда место ушло, и возвращается, когда пришло', () => {
    useLayoutStore.getState().setRoom(1000)
    expect(isMainShown(useLayoutStore.getState())).toBe(false)

    useLayoutStore.getState().setRoom(1252)
    expect(isMainShown(useLayoutStore.getState())).toBe(true)
  })

  it('клик по её иконке не сворачивает её, а ужимает панели и показывает', () => {
    useLayoutStore.getState().setRoom(1000)
    useLayoutStore.getState().selectMainView('file')

    const state = useLayoutStore.getState()

    expect(state.main).toEqual({ activeViewId: 'file', isOpen: true })
    expect(state.side.width + state.provider.width).toBeLessThanOrEqual(692)
    expect(isMainShown(state)).toBe(true)
  })

  it('показанную клик по той же иконке сворачивает, панели не трогает', () => {
    useLayoutStore.getState().selectMainView('file')

    const state = useLayoutStore.getState()

    expect(state.main.isOpen).toBe(false)
    expect(state.side.width).toBe(280)
    expect(state.provider.width).toBe(520)
  })

  it('свёрнутая человеком не возвращается сама, сколько бы места ни пришло', () => {
    useLayoutStore.getState().selectMainView('file')
    useLayoutStore.getState().setRoom(3000)

    expect(isMainShown(useLayoutStore.getState())).toBe(false)
  })
})
