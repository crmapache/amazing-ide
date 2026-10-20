import { it, expect, describe } from 'vitest'

import type { Layout } from './layout.types'
import { restoreLayout } from './layout.utils'

const defaults: Layout = {
  side: { activeViewId: 'files', isOpen: true, width: 280 },
  main: { activeViewId: 'file', isOpen: true },
  provider: { activeViewId: 'claude-code', isOpen: true, width: 440 },
}

describe('restoreLayout', () => {
  it('берёт сохранённое, если вид ещё существует', () => {
    const saved = {
      side: { activeViewId: 'files', isOpen: false, width: 320 },
      main: { activeViewId: 'statistics', isOpen: false },
      provider: { activeViewId: 'claude-code', isOpen: false, width: 500 },
    }

    expect(restoreLayout(saved, defaults)).toEqual(saved)
  })

  it('удалённый вид заменяет видом по умолчанию, остальное сохраняет', () => {
    const saved = {
      side: { activeViewId: 'search', isOpen: true, width: 300 },
      main: { activeViewId: 'terminal', isOpen: false },
    }

    const restored = restoreLayout(saved, defaults)

    expect(restored.side).toEqual({ activeViewId: 'files', isOpen: true, width: 300 })
    expect(restored.main).toEqual({ activeViewId: 'file', isOpen: false })
  })

  it('раскладка от версии без видов середины открывает файл', () => {
    const saved = {
      side: { activeViewId: 'files', isOpen: true, width: 300 },
      provider: { activeViewId: 'claude-code', isOpen: true, width: 500 },
    }

    expect(restoreLayout(saved, defaults).main).toEqual({ activeViewId: 'file', isOpen: true })
  })

  it('битое или пустое сохранённое - раскладка по умолчанию', () => {
    expect(restoreLayout(undefined, defaults)).toEqual(defaults)
    expect(restoreLayout({ side: 'oops', main: 7, provider: { width: '1' } }, defaults)).toEqual(
      defaults,
    )
  })
})
