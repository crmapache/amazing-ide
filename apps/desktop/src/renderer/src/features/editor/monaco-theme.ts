import type * as Monaco from 'monaco-editor/editor/editor.api.js'

import { TINT_ROLES, TYPE_ROLES, THEME_ROLES, EDITOR_THEME } from './monaco-theme.constants'
import type { Rgba, ThemeTints, ThemeColors } from './monaco-theme.types'
import { diffColors, tokenRules, editorColors } from './monaco-theme.utils'

const readRole = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/**
 * Любой цвет CSS (шестнадцатеричный, rgb с прозрачностью, color-mix) - числами: холст
 * сам разбирает цвет и отдаёт пиксель. Свой разбор строк споткнулся бы на color-mix.
 */
const createColorReader = () => {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })

  return (value: string): Rgba => {
    if (!context) return { r: 0, g: 0, b: 0, a: 1 }

    context.clearRect(0, 0, 1, 1)
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)

    const [r = 0, g = 0, b = 0, a = 255] = context.getImageData(0, 0, 1, 1).data

    return { r, g, b, a: a / 255 }
  }
}

/** Тема редактора из ролей дизайн-системы, какими они сейчас стоят в окне. */
export const defineEditorTheme = (monaco: typeof Monaco) => {
  const read = createColorReader()
  const colors = Object.fromEntries(
    Object.entries(THEME_ROLES).map(([key, role]) => [key, read(readRole(role))]),
  ) as ThemeColors
  // Доля в токене - процентом («16%»): Monaco нужна доля.
  const tints: ThemeTints = {
    soft: Number.parseFloat(readRole(TINT_ROLES.soft)) / 100,
    border: Number.parseFloat(readRole(TINT_ROLES.border)) / 100,
  }

  monaco.editor.defineTheme(EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: tokenRules(colors),
    colors: { ...editorColors(colors), ...diffColors(colors, tints) },
  })
}

/** Шрифт кода из токенов: семейство, кегль в пикселях, межстрочный множителем. */
export const editorTypography = () => ({
  fontFamily: readRole(TYPE_ROLES.family),
  fontSize: Number.parseFloat(readRole(TYPE_ROLES.size)),
  lineHeight: Number.parseFloat(readRole(TYPE_ROLES.lineHeight)),
})
