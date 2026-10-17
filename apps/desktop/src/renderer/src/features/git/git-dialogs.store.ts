import { create } from 'zustand'

/** Какой диалог git открыт поверх окна. */
export type GitDialogKind = 'newBranch' | 'checkoutRevision' | 'push'

type GitDialogsStore = {
  dialog: GitDialogKind | null
  openDialog: (dialog: GitDialogKind) => void
  closeDialog: () => void
}

/**
 * Открытый диалог git активного проекта. Открывают его и меню ветки, и поиск везде
 * (действие «Push…»), а рисует BranchSwitcher - поэтому состояние не внутри него.
 */
export const useGitDialogsStore = create<GitDialogsStore>()((set) => ({
  dialog: null,
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
}))
