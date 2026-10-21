import clsx from 'clsx'
import type { ThemedToken } from 'shiki/core'

import { tokenRole } from './highlighter'
import { FONT_STYLE_BOLD, FONT_STYLE_ITALIC } from './highlighter.constants'

/** Класс CSS для роли shiki: `token-keyword` - `tokenKeyword`. */
const roleClass = (role: string) =>
  role.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase())

/**
 * Классы токена: цвет роли и начертание - из модуля стилей, куда включён миксин
 * `syntax-role-classes` (`_syntax-roles.scss`). Цвет приходит переменной темы shiki, а
 * не числом, поэтому inline-стиль не нужен - класс берёт роль из токенов. Общее для
 * блоков кода ленты Claude Code и просмотра Markdown.
 */
export const tokenClassName = (
  token: ThemedToken,
  styles: Readonly<Record<string, string>>,
): string => {
  const fontStyle = token.fontStyle ?? 0

  return clsx(
    styles[roleClass(tokenRole(token.color))],
    (fontStyle & FONT_STYLE_ITALIC) !== 0 && styles['italic'],
    (fontStyle & FONT_STYLE_BOLD) !== 0 && styles['bold'],
  )
}
