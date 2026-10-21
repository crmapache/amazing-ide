import { it, vi, expect, describe, afterEach, beforeEach } from 'vitest'

import { useEditorSelectionStore } from '../../state/editor-selection.store'
import { watchSelection } from './editor-selection'
import { SELECTION_PUBLISH_DELAY_MS } from './editor.constants'

type Lines = { from: number; to: number } | null

/** Редактор без Monaco: выделение строк задаётся руками, событие сдвига - тоже. */
const fakeEditor = (path: string) => {
  let lines: Lines = null
  let onChange: () => void = () => undefined
  const instance = {
    getModel: () => ({ getValueLengthInRange: () => 4, getValueInRange: () => 'text' }),
    getSelection: () =>
      lines && {
        startLineNumber: lines.from,
        startColumn: 1,
        endLineNumber: lines.to,
        endColumn: 5,
        isEmpty: () => false,
      },
    onDidChangeCursorSelection: (listener: () => void) => {
      onChange = listener
      return { dispose: () => undefined }
    },
  }
  const select = (next: Lines) => {
    lines = next
    onChange()
  }

  return { instance, select, owner: () => ({ projectId: 'p1', path }) }
}

const watch = (editor: ReturnType<typeof fakeEditor>, isShown: () => boolean) =>
  watchSelection(
    editor.instance as unknown as Parameters<typeof watchSelection>[0],
    editor.owner,
    isShown,
  )

const shownPath = () => useEditorSelectionStore.getState().selection?.path ?? null

describe('watchSelection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
    useEditorSelectionStore.getState().setSelection(null)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('говорит после паузы, и только редактор на виду', () => {
    const code = fakeEditor('a.ts')
    const diff = fakeEditor('b.ts')

    watch(code, () => true)
    watch(diff, () => false)
    code.select({ from: 2, to: 3 })
    diff.select({ from: 7, to: 7 })
    vi.advanceTimersByTime(SELECTION_PUBLISH_DELAY_MS)

    expect(shownPath()).toBe('a.ts')
  })

  it('показанный снова говорит своё выделение', () => {
    const code = fakeEditor('a.ts')
    let codeShown = true
    const codeWatch = watch(code, () => codeShown)
    const diff = fakeEditor('b.ts')
    const diffWatch = watch(diff, () => !codeShown)

    code.select({ from: 2, to: 3 })
    vi.advanceTimersByTime(SELECTION_PUBLISH_DELAY_MS)
    codeShown = false
    diffWatch.publish()
    expect(shownPath()).toBeNull()

    codeShown = true
    codeWatch.publish()
    expect(useEditorSelectionStore.getState().selection).toMatchObject({ path: 'a.ts', from: 2 })
  })

  it('уходя, убирает только своё выделение, а не соседа', () => {
    const code = fakeEditor('a.ts')
    const diff = fakeEditor('b.ts')
    const codeWatch = watch(code, () => true)
    const diffWatch = watch(diff, () => true)

    diff.select({ from: 1, to: 1 })
    vi.advanceTimersByTime(SELECTION_PUBLISH_DELAY_MS)
    code.select({ from: 5, to: 6 })
    vi.advanceTimersByTime(SELECTION_PUBLISH_DELAY_MS)

    diffWatch.dispose()
    expect(shownPath()).toBe('a.ts')

    codeWatch.dispose()
    expect(shownPath()).toBeNull()
  })
})
