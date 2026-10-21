import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_DIFF_VIEW, DIFF_VIEW_STORAGE_KEY } from './diff-view.constants'
import type { DiffLayout, DiffViewOptions } from './editor.types'

type DiffViewStore = DiffViewOptions & {
  setLayout: (layout: DiffLayout) => void
  toggleCollapsed: () => void
}

const LAYOUTS: ReadonlySet<unknown> = new Set<DiffLayout>(['sideBySide', 'unified'])

/** Сохранённое прошлым запуском - только то, что понятно этому: иначе как по умолчанию. */
const restore = (saved: unknown): Partial<DiffViewOptions> => {
  const { layout, collapsed } = (saved ?? {}) as Record<string, unknown>

  return {
    ...(LAYOUTS.has(layout) && { layout: layout as DiffLayout }),
    ...(typeof collapsed === 'boolean' && { collapsed }),
  }
}

/**
 * Как показана разница файла: две колонки или одна, свёрнуто ли неизменённое. Выбор один
 * на все файлы и помнится между перезапусками, как настройки просмотра разницы в WebStorm.
 */
export const useDiffViewStore = create<DiffViewStore>()(
  persist(
    (set) => ({
      ...DEFAULT_DIFF_VIEW,
      setLayout: (layout) => set({ layout }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: DIFF_VIEW_STORAGE_KEY,
      partialize: ({ layout, collapsed }) => ({ layout, collapsed }),
      merge: (saved, current) => ({ ...current, ...restore(saved) }),
    },
  ),
)
