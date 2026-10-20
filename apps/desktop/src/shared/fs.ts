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

/**
 * Куда ведёт путь, написанный в тексте (лента Claude Code), - ответ главного процесса,
 * который спросил диск. Файл и папка проекта - от корня через «/» в NFC, как в дереве;
 * вне проекта - абсолютный путь. choose - голое имя нашлось в нескольких местах проекта
 * (пути от корня, ближние к корню первыми). missing - ничего нет или путь отвергнут
 * (сетевой): ссылка в никуда должна сказать об этом, а не промолчать.
 */
export type PathLocation =
  | { kind: 'projectFile'; relativePath: string }
  | { kind: 'projectFolder'; relativePath: string }
  | { kind: 'outsideFile'; absolutePath: string }
  | { kind: 'outsideFolder'; absolutePath: string }
  | { kind: 'choose'; candidates: string[] }
  | { kind: 'missing' }
