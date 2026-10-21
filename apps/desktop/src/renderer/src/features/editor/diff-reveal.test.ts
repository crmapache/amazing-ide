import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest'

import { showWhenCompared } from './diff-reveal'
import { DIFF_COMPARE_WAIT_MS, DIFF_COMPARING_ATTRIBUTE } from './editor.constants'

type Changes = { modifiedStartLineNumber: number }[] | null

const FRAME_MS = 16

/** Разница без Monaco: итог сравнения и событие пересчёта задаются руками. */
const fakeDiff = () => {
  let changes: Changes = null
  let listener: (() => void) | null = null
  const diff = {
    onDidUpdateDiff: (next: () => void) => {
      listener = next

      return { dispose: () => (listener = null) }
    },
    getLineChanges: () => changes,
    revealFirstDiff: vi.fn(),
  }
  const update = (next: Changes) => {
    changes = next
    listener?.()
  }

  return { diff, update }
}

const fakeHost = () => {
  const attributes = new Set<string>()

  return {
    setAttribute: (name: string) => void attributes.add(name),
    removeAttribute: (name: string) => void attributes.delete(name),
    isHidden: () => attributes.has(DIFF_COMPARING_ATTRIBUTE),
  }
}

const show = (fake: ReturnType<typeof fakeDiff>, host: ReturnType<typeof fakeHost>) =>
  showWhenCompared(fake.diff as unknown as Parameters<typeof showWhenCompared>[0], host)

describe('showWhenCompared', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
    // Кадр в Node - таймер на кадр: поддельные часы промотают его так же.
    vi.stubGlobal('requestAnimationFrame', (draw: () => void) => setTimeout(draw, FRAME_MS))
    vi.stubGlobal('cancelAnimationFrame', (frame: number) => clearTimeout(frame))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('прячет, пока не сравнил, и показывает кадром позже у первой правки', () => {
    const fake = fakeDiff()
    const host = fakeHost()

    show(fake, host)
    expect(host.isHidden()).toBe(true)

    fake.update(null)
    expect(host.isHidden()).toBe(true)

    fake.update([{ modifiedStartLineNumber: 5 }])
    expect(fake.diff.revealFirstDiff).toHaveBeenCalledOnce()
    expect(host.isHidden()).toBe(true)

    vi.advanceTimersByTime(FRAME_MS)
    expect(host.isHidden()).toBe(false)
  })

  it('без различий тоже показывает: ноль правок - это итог', () => {
    const fake = fakeDiff()
    const host = fakeHost()

    show(fake, host)
    fake.update([])
    vi.advanceTimersByTime(FRAME_MS)

    expect(host.isHidden()).toBe(false)
  })

  it('затянулось - показывает как есть, и поздний итог курсор не двигает', () => {
    const fake = fakeDiff()
    const host = fakeHost()

    show(fake, host)
    vi.advanceTimersByTime(DIFF_COMPARE_WAIT_MS)
    expect(host.isHidden()).toBe(false)

    fake.update([{ modifiedStartLineNumber: 5 }])
    expect(fake.diff.revealFirstDiff).not.toHaveBeenCalled()
  })

  it('отписка показывает спрятанное и больше ничего не ждёт', () => {
    const fake = fakeDiff()
    const host = fakeHost()

    show(fake, host).dispose()
    expect(host.isHidden()).toBe(false)

    fake.update([{ modifiedStartLineNumber: 5 }])
    vi.advanceTimersByTime(DIFF_COMPARE_WAIT_MS)
    expect(fake.diff.revealFirstDiff).not.toHaveBeenCalled()
  })
})
