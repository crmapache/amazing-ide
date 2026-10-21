import { create } from 'zustand'

/**
 * Выделенные строки в редакторе: файл, первая и последняя строка (с 1), текст -
 * если не длиннее предела заметки модели. Пишет редактор, читает поле ввода Claude Code:
 * выделение уходит с сообщением, как в плагине для JetBrains.
 */
export type EditorSelection = {
  projectId: string
  path: string
  from: number
  to: number
  text: string | undefined
}

type EditorSelectionStore = {
  selection: EditorSelection | null
  setSelection: (selection: EditorSelection | null) => void
}

export const useEditorSelectionStore = create<EditorSelectionStore>()((set) => ({
  selection: null,
  setSelection: (selection) => set({ selection }),
}))

/** Выделение в файле проекта; в другом файле или без выделения - null. */
export const useEditorSelection = (projectId: string, path: string | undefined) =>
  useEditorSelectionStore((state) =>
    state.selection?.projectId === projectId && state.selection.path === path
      ? state.selection
      : null,
  )
