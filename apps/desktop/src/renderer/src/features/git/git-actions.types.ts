import type { LucideIcon } from 'lucide-react'

/** Действия git, которые уже умеем: им нужно окно-диалог или итог в углу окна. */
export type GitAction = 'update' | 'push' | 'newBranch' | 'checkoutRevision'

/**
 * Действие git для меню ветки и поиска везде - одно описание на оба места, чтобы
 * подпись и иконка не разошлись. commit пока недоступен: для него нужен свой инструмент.
 */
export type GitActionEntry = {
  id: GitAction | 'commit'
  labelKey:
    'git.updateProject' | 'git.commit' | 'git.push' | 'git.newBranch' | 'git.checkoutRevision'
  icon: LucideIcon | undefined
  /** Ещё слова, по которым действие находит поиск везде: «git», «pull». */
  keywords: readonly string[]
}
