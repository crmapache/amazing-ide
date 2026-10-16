import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const FILE_TREE_STORAGE_KEY = 'amazing-ide.file-tree.v1'

type FileTreeStore = {
  /** Раскрытые папки каждого проекта: пути от корня. */
  expandedByProject: Record<string, string[]>
  toggleDirectory: (projectId: string, relativePath: string) => void
}

/** Какие папки раскрыты в дереве. Нужно только дереву, поэтому живёт в его фиче. */
export const useFileTreeStore = create<FileTreeStore>()(
  persist(
    (set) => ({
      expandedByProject: {},
      toggleDirectory: (projectId, relativePath) =>
        set((state) => {
          const expanded = state.expandedByProject[projectId] ?? []
          const next = expanded.includes(relativePath)
            ? expanded.filter((path) => path !== relativePath)
            : [...expanded, relativePath]

          return { expandedByProject: { ...state.expandedByProject, [projectId]: next } }
        }),
    }),
    { name: FILE_TREE_STORAGE_KEY },
  ),
)

export const useIsExpanded = (projectId: string, relativePath: string) =>
  useFileTreeStore((state) => state.expandedByProject[projectId]?.includes(relativePath) ?? false)
