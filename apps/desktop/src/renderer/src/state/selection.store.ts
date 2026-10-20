import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SELECTION_STORAGE_KEY = 'amazing-ide.selection.v1'

/**
 * Где в файле встать, когда его открыли не из дерева: всё с 1, как считает человек.
 * Диапазон (endLine, endColumn) редактор выделяет, конец включительно. find - текст
 * строки, когда номера нет (первая добавленная строка правки): CLI не сообщает, где
 * в файле правка, и место ищет редактор по тексту.
 */
export type FilePlace = {
  line?: number
  column?: number
  endLine?: number
  endColumn?: number
  find?: string
}

type SelectionStore = {
  /** Выбранный файл каждого проекта: путь от корня. Переключил вкладку - вернулся к своему. */
  selectedFileByProject: Record<string, string>
  /** Где встать в выбранном файле; нет - открыть как есть. */
  selectedPlaceByProject: Record<string, FilePlace | undefined>
  selectFile: (projectId: string, relativePath: string, place?: FilePlace) => void
}

/**
 * Какой файл открыт в редакторе. Общее для дерева файлов (подсветка), редактора
 * (что показать и где встать) и строки состояния (путь), поэтому живёт здесь, а не в
 * одной фиче.
 */
export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set) => ({
      selectedFileByProject: {},
      selectedPlaceByProject: {},
      // Выбор без места (клик в дереве) сбрасывает место прошлого выбора.
      selectFile: (projectId, relativePath, place) =>
        set((state) => ({
          selectedFileByProject: { ...state.selectedFileByProject, [projectId]: relativePath },
          selectedPlaceByProject: { ...state.selectedPlaceByProject, [projectId]: place },
        })),
    }),
    // Место - просьба этого запуска: после перезапуска файл открывается как есть.
    {
      name: SELECTION_STORAGE_KEY,
      partialize: ({ selectedFileByProject }) => ({ selectedFileByProject }),
    },
  ),
)

export const useSelectedFile = (projectId: string | undefined) =>
  useSelectionStore((state) => (projectId ? state.selectedFileByProject[projectId] : undefined))

/** Где встать в выбранном файле проекта - для редактора. */
export const useSelectedPlace = (projectId: string | undefined) =>
  useSelectionStore((state) => (projectId ? state.selectedPlaceByProject[projectId] : undefined))
