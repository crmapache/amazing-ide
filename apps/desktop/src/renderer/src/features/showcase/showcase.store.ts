import { create } from 'zustand'

type ShowcaseStore = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

/** Открыта ли витрина дизайн-системы. Не переживает перезапуск: это инструмент, а не вид. */
export const useShowcaseStore = create<ShowcaseStore>()((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}))
