import { it, vi, expect, describe } from 'vitest'

import { focusOnRevert } from './diff-revert'

type Position = { lineNumber: number; column: number }
type Selection = { startLineNumber: number; endLineNumber: number }

/**
 * Разница без Monaco: правая сторона помнит фокус, курсор и версию текста, а возврат Monaco
 * либо правит текст (версия растёт), либо молча пропускается, как при пересчёте разницы.
 */
const fakeDiff = ({ applies }: { applies: boolean }) => {
  let version = 1
  let position: Position | null = { lineNumber: 40, column: 3 }
  let selection: Selection = { startLineNumber: 40, endLineNumber: 40 }
  const modified = {
    focus: vi.fn(),
    getModel: () => ({ getVersionId: () => version }),
    getSelection: () => selection,
    setSelection: (next: Selection) => {
      selection = next
      position = { lineNumber: next.startLineNumber, column: 1 }
    },
    setPosition: (next: Position) => {
      position = next
      selection = { startLineNumber: next.lineNumber, endLineNumber: next.lineNumber }
    },
  }
  const revert = vi.fn((_mapping: unknown) => {
    if (!applies) return

    version += 1
    // Вставка строк удалённого куска сдвигает курсор под них, как у Monaco.
    if (position) position = { ...position, lineNumber: position.lineNumber + 3 }
  })
  const diff = {
    getModifiedEditor: () => modified,
    revert,
    revertRangeMappings: vi.fn((_mappings: unknown) => undefined),
  }

  focusOnRevert(diff as unknown as Parameters<typeof focusOnRevert>[0])

  return { diff, modified, revert, position: () => position }
}

const mapping = { modified: { startLineNumber: 21 } }

describe('focusOnRevert', () => {
  it('возврат ставит фокус справа и курсор к началу куска - и до, и после', () => {
    const fake = fakeDiff({ applies: true })
    let atRevert: Position | null = null

    fake.revert.mockImplementationOnce(() => {
      atRevert = fake.position()
    })
    fake.diff.revert(mapping)

    expect(fake.modified.focus).toHaveBeenCalled()
    expect(atRevert).toEqual({ lineNumber: 21, column: 1 })
  })

  it('вставленные строки не уводят курсор под кусок', () => {
    const fake = fakeDiff({ applies: true })

    fake.diff.revert(mapping)

    expect(fake.position()).toEqual({ lineNumber: 21, column: 1 })
  })

  it('пропущенный возврат (разница пересчитывается) оставляет курсор на месте', () => {
    const fake = fakeDiff({ applies: false })

    fake.diff.revert(mapping)

    expect(fake.revert).toHaveBeenCalledOnce()
    expect(fake.position()?.lineNumber).toBe(40)
  })

  it('«вернуть выделенное» - фокус справа, выделение не трогается', () => {
    const fake = fakeDiff({ applies: true })

    fake.diff.revertRangeMappings([])

    expect(fake.modified.focus).toHaveBeenCalled()
    expect(fake.position()).toEqual({ lineNumber: 40, column: 3 })
  })
})
