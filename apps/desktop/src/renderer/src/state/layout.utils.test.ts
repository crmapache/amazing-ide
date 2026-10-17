import { it, expect, describe } from 'vitest'

import type { LayoutPanels } from './layout.types'
import { restoreLayout } from './layout.utils'

const defaults: LayoutPanels = {
  side: { activeViewId: 'files', isOpen: true, width: 280 },
  provider: { activeViewId: 'claude-code', isOpen: true, width: 440 },
}

describe('restoreLayout', () => {
  it('берёт сохранённое, если вид ещё существует', () => {
    const saved = {
      side: { activeViewId: 'files', isOpen: false, width: 320 },
      provider: { activeViewId: 'claude-code', isOpen: false, width: 500 },
    }

    expect(restoreLayout(saved, defaults)).toEqual(saved)
  })

  it('удалённый вид заменяет видом по умолчанию, остальное сохраняет', () => {
    const saved = { side: { activeViewId: 'search', isOpen: true, width: 300 } }

    expect(restoreLayout(saved, defaults).side).toEqual({
      activeViewId: 'files',
      isOpen: true,
      width: 300,
    })
  })

  it('битое или пустое сохранённое - раскладка по умолчанию', () => {
    expect(restoreLayout(undefined, defaults)).toEqual(defaults)
    expect(restoreLayout({ side: 'oops', provider: { width: '1' } }, defaults)).toEqual(defaults)
  })
})
