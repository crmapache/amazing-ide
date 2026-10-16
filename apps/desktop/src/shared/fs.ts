export type DirectoryEntryKind = 'directory' | 'file'

/** Строка дерева файлов: один элемент каталога проекта. */
export type DirectoryEntry = {
  name: string
  /** Путь от корня проекта, через «/». У корня - пустая строка. */
  relativePath: string
  kind: DirectoryEntryKind
  /** Элемент - символическая ссылка. kind при этом описывает то, куда она ведёт. */
  isSymlink: boolean
}
