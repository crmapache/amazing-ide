import type { ReactNode } from 'react'

import type { FilePlace } from '../../state/selection.store'

/**
 * Куда ведёт ссылка из просмотра: сайт, заголовок этого файла, путь проекта (файл или
 * папка - решит общее действие «открыть файл») или никуда.
 */
export type PreviewLinkTarget =
  | { kind: 'web'; url: string }
  | { kind: 'anchor'; id: string }
  | { kind: 'file'; path: string; place: FilePlace | undefined }
  | { kind: 'none' }

/**
 * Откуда картинка: с сайта по https (только по просьбе человека, грузит главный
 * процесс), вписанная data URL, файл проекта или ниоткуда.
 */
export type PreviewImageSource =
  | { kind: 'web'; url: string }
  | { kind: 'inline'; url: string }
  | { kind: 'project'; path: string }
  | { kind: 'none' }

/** Картинка из разметки: адрес как написан, подпись, размер и выравнивание. */
export type PreviewImageData = {
  src: string
  alt: string
  width: string | undefined
  height: string | undefined
  align: string | undefined
}

/**
 * Чем просмотр рисует то, что не просто тег: блок кода с подсветкой, картинку, ссылку,
 * отметку пункта-дела, метку строки исходника. Разбор (markdown-dom.utils.ts) зовёт их,
 * а сами они - компоненты просмотра.
 */
export type PreviewRenderers = {
  code: (code: string, language: string) => ReactNode
  image: (image: PreviewImageData) => ReactNode
  link: (href: string, children: ReactNode[]) => ReactNode
  task: (checked: boolean) => ReactNode
  lineMark: (line: number) => ReactNode
}

/** Собранный просмотр: что рисовать и адреса всех картинок в нём, как написаны. */
export type PreviewDocument = { content: ReactNode; images: readonly string[] }

/** Метка строки исходника в просмотре: номер строки и высота от верха текста просмотра. */
export type LineMark = { line: number; top: number }
