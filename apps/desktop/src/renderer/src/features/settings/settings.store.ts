import { create } from 'zustand'

type SettingsStore = {
  isOpen: boolean
  open: () => void
  close: () => void
}

/**
 * Открыт ли экран настроек IDE. Открывают его меню программы (⌘,) и поиск везде, а
 * рисует workbench - поэтому состояние не внутри диалога.
 */
export const useSettingsStore = create<SettingsStore>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
