import { Fragment, createElement } from 'react'
import type { ReactNode } from 'react'

import { createSlugger } from './markdown-links.utils'
import {
  ALIGNS,
  KEPT_TAGS,
  TEXT_NODE,
  SIZE_VALUE,
  DROPPED_TAGS,
  ELEMENT_NODE,
  NO_TEXT_TAGS,
  NUMBER_VALUE,
  ANCHOR_PREFIX,
  LINE_MARK_TAG,
} from './markdown-preview.constants'
import type { PreviewDocument, PreviewRenderers } from './markdown-preview.types'

/** Обход документа: чем рисовать, якоря заголовков и адреса встреченных картинок. */
type Walk = { renderers: PreviewRenderers; slug: (text: string) => string; images: string[] }

const HEADING = /^h[1-6]$/

const valueOf = (element: Element, name: string, pattern: RegExp): string | undefined => {
  const value = element.getAttribute(name)?.trim()

  return value !== undefined && pattern.test(value) ? value : undefined
}

/** Размер картинки: `200px` - как `200` (так его понимают браузер и GitHub). */
const sizeOf = (element: Element, name: string): string | undefined =>
  valueOf(element, name, SIZE_VALUE)?.replace(/px$/i, '')

const alignOf = (element: Element): string | undefined => {
  const align = element.getAttribute('align')?.trim().toLowerCase()

  return align !== undefined && ALIGNS.has(align) ? align : undefined
}

/**
 * Атрибуты, которые просмотр оставляет тегу, - без обработчиков, стилей, классов и
 * адресов (адреса - только у ссылок и картинок, через их компоненты). id - с
 * приставкой: якорь файла не совпадёт с id окна. Заголовок без своего id получает якорь
 * по тексту, как на GitHub.
 */
const keptProps = (element: Element, tag: string, walk: Walk): Record<string, unknown> => {
  const props: Record<string, unknown> = {}
  const id = element.getAttribute('id') ?? (tag === 'a' ? element.getAttribute('name') : null)
  const align = alignOf(element)

  if (id) props['id'] = ANCHOR_PREFIX + id
  else if (HEADING.test(tag)) props['id'] = ANCHOR_PREFIX + walk.slug(element.textContent ?? '')

  if (align) props['align'] = align
  if (tag === 'td' || tag === 'th') {
    props['colSpan'] = valueOf(element, 'colspan', NUMBER_VALUE)
    props['rowSpan'] = valueOf(element, 'rowspan', NUMBER_VALUE)
  }

  if (tag === 'ol') props['start'] = valueOf(element, 'start', NUMBER_VALUE)
  if (tag === 'details' && element.hasAttribute('open')) props['open'] = true

  return props
}

/** Блок кода разбора: `<pre><code class="language-ts">`, язык - из класса. */
const codeBlockOf = (pre: Element): { code: string; language: string } | null => {
  const [code, ...rest] = [...pre.children]

  if (!code || rest.length > 0 || code.localName !== 'code') return null

  const language = /(?:^|\s)language-([\w#+.-]+)/.exec(code.getAttribute('class') ?? '')?.[1]

  // Разбор оставляет перевод строки после последней строки кода - пустой строкой он не нужен.
  return { code: (code.textContent ?? '').replace(/\n$/, ''), language: language ?? '' }
}

const convertChildren = (parent: Element, walk: Walk, tag: string): ReactNode[] => {
  const children = [...parent.childNodes].flatMap((child) => convert(child, walk))

  return NO_TEXT_TAGS.has(tag)
    ? children.filter((child) => typeof child !== 'string' || child.trim() !== '')
    : children
}

/** Особые теги: метка строки, блок кода, картинка, ссылка, отметка пункта-дела. */
const convertSpecial = (element: Element, tag: string, walk: Walk): ReactNode[] | null => {
  const { renderers } = walk

  if (tag === LINE_MARK_TAG) {
    const line = Number(element.getAttribute('data-line'))

    return Number.isInteger(line) && line > 0 ? [renderers.lineMark(line)] : []
  }

  if (tag === 'pre') {
    const block = codeBlockOf(element)

    return block ? [renderers.code(block.code, block.language)] : null
  }

  if (tag === 'img') {
    const src = element.getAttribute('src') ?? ''

    walk.images.push(src)

    return [
      renderers.image({
        src,
        alt: element.getAttribute('alt') ?? '',
        width: sizeOf(element, 'width'),
        height: sizeOf(element, 'height'),
        align: alignOf(element),
      }),
    ]
  }

  if (tag === 'a' && element.hasAttribute('href')) {
    return [renderers.link(element.getAttribute('href') ?? '', convertChildren(element, walk, tag))]
  }

  if (tag === 'input') {
    return element.getAttribute('type')?.toLowerCase() === 'checkbox'
      ? [renderers.task(element.hasAttribute('checked'))]
      : []
  }

  return null
}

function convert(node: ChildNode, walk: Walk): ReactNode[] {
  if (node.nodeType === TEXT_NODE) return [node.textContent ?? '']
  if (node.nodeType !== ELEMENT_NODE) return []

  const element = node as Element
  const tag = element.localName

  if (DROPPED_TAGS.has(tag)) return []

  const special = convertSpecial(element, tag, walk)

  if (special) return special
  if (!KEPT_TAGS.has(tag)) return convertChildren(element, walk, tag)

  return [createElement(tag, keptProps(element, tag, walk), ...convertChildren(element, walk, tag))]
}

/**
 * HTML разбора (markdownToHtml) - элементами React. Строка разбирается браузером в
 * отдельный документ без окна: скрипты в нём не исполняются, картинки не грузятся. В
 * страницу идёт только то, что из него собрано по списку (KEPT_TAGS и атрибуты
 * keptProps), - innerHTML нет, HTML из чужого README не исполнит ничего в окне IDE.
 * Блоки - детьми одного фрагмента, а не списком: это не список, ключи им не нужны.
 */
export const htmlToElements = (html: string, renderers: PreviewRenderers): PreviewDocument => {
  const { body } = new DOMParser().parseFromString(html, 'text/html')
  const walk: Walk = { renderers, slug: createSlugger(), images: [] }
  const blocks = [...body.childNodes].flatMap((child) => convert(child, walk))

  return { content: createElement(Fragment, null, ...blocks), images: walk.images }
}
