import { it, expect, describe } from 'vitest'

import { pointInEditor, pointUnderCaret } from './EditorContextMenu.utils'

describe('pointInEditor', () => {
  it('точка нажатия - от левого верхнего угла редактора', () => {
    expect(pointInEditor({ x: 600, y: 227 }, { left: 406, top: 128 })).toEqual({ x: 194, y: 99 })
  })
})

describe('pointUnderCaret', () => {
  it('под кареткой: её левый край и низ строки', () => {
    expect(pointUnderCaret({ left: 120, top: 40, height: 20 })).toEqual({ x: 120, y: 60 })
  })

  it('без модели места каретки нет - меню не открыть', () => {
    expect(pointUnderCaret(null)).toBeNull()
  })
})
