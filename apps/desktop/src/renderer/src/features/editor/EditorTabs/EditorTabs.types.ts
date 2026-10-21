export type EditorTabsProps = {
  projectId: string
  /** Вкладки в порядке на полосе. */
  paths: readonly string[]
  /** Файл активной вкладки. */
  active: string
}

export type EditorTabProps = {
  projectId: string
  path: string
  label: string
  isActive: boolean
  onMenu: (path: string, anchor: HTMLElement) => void
}

export type TabMenuProps = {
  projectId: string
  paths: readonly string[]
  /** Вкладка, на которой открыли меню, и куда его поставить; null - меню закрыто. */
  target: { path: string; anchor: HTMLElement } | null
  onClose: () => void
}
