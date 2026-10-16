import { create } from 'zustand'

export type GitNotice = {
  tone: 'success' | 'danger'
  title: string
  /** Что ответил git: по строкам, как есть. */
  details: string
}

type GitNoticeStore = {
  notice: GitNotice | null
  show: (notice: GitNotice) => void
  dismiss: () => void
}

/** Итог последнего действия git для угла окна. Новое действие заменяет старый итог. */
export const useGitNoticeStore = create<GitNoticeStore>()((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}))
