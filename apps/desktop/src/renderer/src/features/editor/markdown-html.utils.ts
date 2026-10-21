import { Marked } from 'marked'
import type { Token } from 'marked'

import { FRONT_MATTER, LINE_MARK_TAG } from './markdown-preview.constants'

/**
 * Файл, а не ответ модели: GFM как у GitHub - таблицы, списки дел, зачёркивание, HTML;
 * перевод строки внутри абзаца - не перенос. Заборы кода - по CommonMark, а не по
 * правилу ленты Claude Code.
 */
const markdown = new Marked({ gfm: true })

const lineBreaks = (text: string) => text.split('\n').length - 1

const lineMark = (line: number) => `<${LINE_MARK_TAG} data-line="${line}"></${LINE_MARK_TAG}>`

/** Шапка YAML блоком кода: так её видно и она не разбирается как заголовок под чертой. */
const frontMatter = (text: string): { raw: string; token: Token } | null => {
  const match = FRONT_MATTER.exec(text)

  if (!match) return null

  return {
    raw: match[0],
    token: { type: 'code', raw: match[0], lang: 'yaml', text: match[1] ?? '' },
  }
}

/**
 * Разметка файла в HTML для просмотра, с меткой строки исходника перед каждым блоком:
 * по меткам код и просмотр прокручиваются вместе. Блоки разбираются по одному и
 * склеиваются - вместе они дают тот же HTML, что и разбор целиком (блок HTML, открытый
 * в одном блоке и закрытый через абзац, собирается разбором HTML уже из строки).
 */
export const markdownToHtml = (source: string): string => {
  const text = source.replace(/\r\n?/g, '\n')
  const front = frontMatter(text)
  const parts: string[] = []
  let line = 1

  if (front) {
    parts.push(lineMark(line), markdown.parser([front.token]))
    line += lineBreaks(front.raw)
  }

  for (const token of markdown.lexer(front ? text.slice(front.raw.length) : text)) {
    if (token.type !== 'space') parts.push(lineMark(line))

    parts.push(markdown.parser([token]))
    line += lineBreaks(token.raw)
  }

  return parts.join('')
}
