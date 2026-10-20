import clsx from 'clsx'

import styles from './FileIcon.module.scss'
import type { FileIconProps } from './FileIcon.types'
import { renderFileIcon, resolveFileIcon } from './FileIcon.utils'

/**
 * Цветная иконка типа файла или папки, как в редакторах: по ней сразу видно, что это
 * за файл. Набор Catppuccin, тона - нашей палитры (--color-file-icon-*). Декоративная:
 * рядом всегда есть имя текстом.
 */
export const FileIcon = ({ path, kind, expanded = false, size = 'md' }: FileIconProps) => {
  const { viewBox, content } = renderFileIcon(resolveFileIcon(path, kind, expanded))

  return (
    // eslint-disable-next-line no-restricted-syntax -- иконки типов файлов - картинки набора Catppuccin, в lucide их нет
    <svg
      aria-hidden
      className={clsx(styles.fileIcon, styles[size])}
      viewBox={viewBox}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round">
      {content}
    </svg>
  )
}
