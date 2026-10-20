import { createElement } from 'react'
import type { ReactNode } from 'react'

import { FILE_ICON_SET } from './file-icon-set.generated'
import { FILE_ICON, FOLDER_ICON, EXPANDED_SUFFIX, DEFAULT_VIEW_BOX } from './FileIcon.constants'
import type { FileIconKind, FileIconNode, RenderedFileIcon } from './FileIcon.types'

const { icons, fileNames, fileExtensions, folderNames } = FILE_ICON_SET

/** Своё поле словаря: файл «constructor» не должен найти Object из прототипа. */
const own = <T>(map: Record<string, T>, key: string): T | undefined =>
  Object.hasOwn(map, key) ? map[key] : undefined

/**
 * Имя картинки для файла или папки - по правилам VS Code, откуда пришли привязки:
 * сначала точное имя, потом расширение от самого длинного («test.ts» раньше «ts»),
 * причём с папкой над файлом («workflows/yml») раньше, чем без неё; не нашлось -
 * общая. Регистр не важен.
 */
export const resolveFileIcon = (path: string, kind: FileIconKind, expanded: boolean): string => {
  const [name = '', parent = ''] = path.toLowerCase().replace(/\/+$/, '').split('/').reverse()

  if (kind === 'folder') {
    const icon = own(folderNames, name) ?? FOLDER_ICON

    return expanded ? `${icon}${EXPANDED_SUFFIX}` : icon
  }

  const exact = own(fileNames, name)

  if (exact) return exact

  for (let dot = name.indexOf('.'); dot !== -1; dot = name.indexOf('.', dot + 1)) {
    const extension = name.slice(dot + 1)
    const icon = own(fileExtensions, `${parent}/${extension}`) ?? own(fileExtensions, extension)

    if (icon) return icon
  }

  return FILE_ICON
}

const renderNodes = (nodes: FileIconNode[]): ReactNode[] =>
  nodes.map(([tag, attributes, children], index) =>
    createElement(tag, { key: index, ...attributes }, children && renderNodes(children)),
  )

const rendered = new Map<string, RenderedFileIcon>()

/**
 * Картинка по имени. Элементы React собираются один раз на иконку: в дереве сотни
 * строк, а разных иконок - десяток-другой. Картинки нет - общая иконка файла.
 */
export const renderFileIcon = (icon: string): RenderedFileIcon => {
  const cached = rendered.get(icon)

  if (cached) return cached

  const art = own(icons, icon) ?? icons[FILE_ICON]
  const result = {
    viewBox: art?.viewBox ?? DEFAULT_VIEW_BOX,
    content: renderNodes(art?.nodes ?? []),
  }

  rendered.set(icon, result)

  return result
}
