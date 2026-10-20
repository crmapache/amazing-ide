import type { ReactNode } from 'react'

/** Что показывает иконка: файл или папку. */
export type FileIconKind = 'file' | 'folder'

/**
 * md - 16 пикселей, родной размер набора: дерево и списки. sm - 14: строка текста и
 * чипы, где иконка стоит рядом с мелким шрифтом.
 */
export type FileIconSize = 'sm' | 'md'

export type FileIconProps = {
  /**
   * Путь через «/» или просто имя: иконку выбирают имя, расширение и папка над файлом.
   * «/» в конце (так пишут папку) не мешает.
   */
  path: string
  kind: FileIconKind
  /** Раскрытая папка - открытая папка. У файла ничего не меняет. */
  expanded?: boolean | undefined
  size?: FileIconSize | undefined
}

/** Элемент картинки иконки: тег, атрибуты React, вложенные элементы. */
export type FileIconNode = [
  tag: string,
  attributes: Record<string, string>,
  children?: FileIconNode[],
]

/** Картинка одной иконки. viewBox - только если не квадрат 16 на 16. */
export type FileIconArt = { nodes: FileIconNode[]; viewBox?: string }

/**
 * Набор иконок (scripts/generate-file-icons.mjs): картинки и привязки, как их читает
 * VS Code. Ключи привязок - в нижнем регистре, значения - имена картинок.
 */
export type FileIconSet = {
  license: string
  icons: Record<string, FileIconArt>
  fileNames: Record<string, string>
  fileExtensions: Record<string, string>
  folderNames: Record<string, string>
}

/** Иконка, готовая к рисованию: рамка картинки и её элементы. */
export type RenderedFileIcon = { viewBox: string; content: ReactNode }
