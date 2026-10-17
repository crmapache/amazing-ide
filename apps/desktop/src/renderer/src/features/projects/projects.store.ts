import { create } from 'zustand'

type ProjectsStore = {
  isCloneOpen: boolean
  openClone: () => void
  closeClone: () => void
}

/**
 * Открыт ли диалог клонирования. Открывают его и меню проекта, и поиск везде, а
 * рисует ProjectSwitcher - поэтому состояние не внутри него.
 */
export const useProjectsStore = create<ProjectsStore>()((set) => ({
  isCloneOpen: false,
  openClone: () => set({ isCloneOpen: true }),
  closeClone: () => set({ isCloneOpen: false }),
}))
