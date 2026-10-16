import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SELECTION_STORAGE_KEY = 'amazing-ide.selection.v1'

type SelectionStore = {
  /** Выбранный файл каждого проекта: путь от корня. Переключил вкладку - вернулся к своему. */
  selectedFileByProject: Record<string, string>
  selectFile: (projectId: string, relativePath: string) => void
}

/**
 * Какой файл открыт в редакторе. Общее для дерева файлов (подсветка), редактора
 * (что показать) и строки состояния (путь), поэтому живёт здесь, а не в одной фиче.
 */
export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set) => ({
      selectedFileByProject: {},
      selectFile: (projectId, relativePath) =>
        set((state) => ({
          selectedFileByProject: { ...state.selectedFileByProject, [projectId]: relativePath },
        })),
    }),
    { name: SELECTION_STORAGE_KEY },
  ),
)

export const useSelectedFile = (projectId: string | undefined) =>
  useSelectionStore((state) => (projectId ? state.selectedFileByProject[projectId] : undefined))
