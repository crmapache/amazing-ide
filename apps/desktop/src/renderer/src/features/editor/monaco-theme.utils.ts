import type { editor } from 'monaco-editor/editor/editor.api.js'

import { tokenScope } from './monaco-languages.utils'
import {
  TRANSPARENT,
  FONT_STYLE_BITS,
  ROLE_FONT_STYLE,
  FONT_STYLE_COMBINATIONS,
} from './monaco-theme.constants'
import type { Rgba, ThemeColors } from './monaco-theme.types'

const channel = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0')

/** Цвет для Monaco: `#rrggbb`, с прозрачностью - `#rrggbbaa`. */
export const toHex = ({ r, g, b, a }: Rgba): string =>
  `#${channel(r)}${channel(g)}${channel(b)}${a < 1 ? channel(a * 255) : ''}`

/** Полупрозрачное поверх непрозрачного - каким его видит глаз. */
export const over = (top: Rgba, bottom: Rgba): Rgba => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
  a: 1,
})

/** Начертание Monaco из маски TextMate: `italic bold`. */
export const fontStyleName = (mask: number): string =>
  FONT_STYLE_BITS.filter(([bit]) => (mask & bit) !== 0)
    .map(([, name]) => name)
    .join(' ')

/**
 * Правила подсветки: роль shiki - цвет роли `--color-syntax-*`, на каждое начертание своё
 * правило (имена - tokenScope). Пустое имя - текст без роли. Комментарий - всегда
 * курсивом. Вставки, удаления и правки в диффах - цветами статусов, как в дереве файлов.
 */
export const tokenRules = (colors: ThemeColors): editor.ITokenThemeRule[] => {
  const roles: Record<string, Rgba> = {
    foreground: colors.syntaxFg,
    'token-keyword': colors.syntaxKeyword,
    'token-string': colors.syntaxString,
    'token-string-expression': colors.syntaxStringExpression,
    'token-function': colors.syntaxFunction,
    'token-constant': colors.syntaxConstant,
    'token-parameter': colors.syntaxParameter,
    'token-punctuation': colors.syntaxPunctuation,
    'token-comment': colors.syntaxComment,
    'token-link': colors.syntaxLink,
    'token-inserted': colors.success,
    'token-deleted': colors.danger,
    'token-changed': colors.modified,
  }
  const styles = Array.from({ length: FONT_STYLE_COMBINATIONS }, (_, mask) => mask)

  return [
    { token: '', foreground: toHex(colors.syntaxFg) },
    ...Object.entries(roles).flatMap(([role, color]) =>
      styles.map((mask) => ({
        token: tokenScope(role, mask),
        foreground: toHex(color),
        fontStyle: fontStyleName(mask | (ROLE_FONT_STYLE[role] ?? 0)),
      })),
    ),
  ]
}

/**
 * Цвета интерфейса редактора из ролей. Фон прозрачный - под ним лист середины окна
 * (`--color-surface-editor`). Всё, что ложится поверх текста (подсказка, палитра команд), -
 * непрозрачное: та же поверхность, сведённая с фоном окна. Теней нет нигде,
 * отделяет рамка (ADR 0006).
 */
export const editorColors = (colors: ThemeColors): editor.IColors => {
  const sheet = over(colors.editor, colors.app)
  const overlay = toHex(over(colors.overlay, sheet))
  const hex = (key: keyof ThemeColors) => toHex(colors[key])

  return {
    foreground: hex('fg'),
    descriptionForeground: hex('fgSubtle'),
    focusBorder: hex('focus'),
    'icon.foreground': hex('fgMuted'),
    'widget.border': hex('borderStrong'),
    'widget.shadow': TRANSPARENT,
    'scrollbar.shadow': TRANSPARENT,
    // Бегунок рисует monaco.css токенами, а сам он прозрачный: Monaco красит его во всю
    // ширину дорожки, а родной бегунок тоньше и отступает от края.
    'scrollbarSlider.background': TRANSPARENT,
    'scrollbarSlider.hoverBackground': TRANSPARENT,
    'scrollbarSlider.activeBackground': TRANSPARENT,
    'editor.background': TRANSPARENT,
    'editor.foreground': hex('syntaxFg'),
    'editorGutter.background': TRANSPARENT,
    'editorLineNumber.foreground': hex('fgDisabled'),
    'editorLineNumber.activeForeground': hex('fgMuted'),
    'editorCursor.foreground': hex('focus'),
    'editor.selectionBackground': hex('selection'),
    'editor.inactiveSelectionBackground': hex('selected'),
    'editor.selectionHighlightBackground': hex('active'),
    'editor.wordHighlightBackground': hex('active'),
    'editor.wordHighlightStrongBackground': hex('active'),
    'editor.wordHighlightTextBackground': hex('active'),
    'editor.lineHighlightBackground': hex('hover'),
    'editor.lineHighlightBorder': TRANSPARENT,
    'editor.findMatchBackground': hex('accentSoftHover'),
    'editor.findMatchBorder': hex('accentBorder'),
    'editor.findMatchHighlightBackground': hex('accentSoft'),
    'editor.findRangeHighlightBackground': hex('hover'),
    'editor.foldBackground': hex('hover'),
    'editorGutter.foldingControlForeground': hex('fgSubtle'),
    'editorIndentGuide.background1': hex('border'),
    'editorIndentGuide.activeBackground1': hex('borderStrong'),
    'editorWhitespace.foreground': hex('borderStrong'),
    'editorRuler.foreground': hex('border'),
    'editorBracketMatch.background': hex('active'),
    'editorBracketMatch.border': hex('borderStrong'),
    'editorOverviewRuler.border': TRANSPARENT,
    // Метки у полосы прокрутки - только то, что ищут по файлу: найденное поиском цветом
    // его подсветки в тексте и ошибки цветами ролей. Вхождения слова под курсором, пары
    // скобок и выделения серыми черточками читались как шум без смысла.
    'editorOverviewRuler.findMatchForeground': hex('accent'),
    'editorOverviewRuler.errorForeground': hex('danger'),
    'editorOverviewRuler.warningForeground': hex('warning'),
    'editorOverviewRuler.infoForeground': hex('info'),
    'editorOverviewRuler.wordHighlightForeground': TRANSPARENT,
    'editorOverviewRuler.wordHighlightStrongForeground': TRANSPARENT,
    'editorOverviewRuler.wordHighlightTextForeground': TRANSPARENT,
    'editorOverviewRuler.selectionHighlightForeground': TRANSPARENT,
    'editorOverviewRuler.bracketMatchForeground': TRANSPARENT,
    'editorOverviewRuler.rangeHighlightForeground': TRANSPARENT,
    'editorLink.activeForeground': hex('syntaxLink'),
    'editorError.foreground': hex('danger'),
    'editorWarning.foreground': hex('warning'),
    'editorInfo.foreground': hex('info'),
    'editorUnicodeHighlight.border': hex('warning'),
    'editorGhostText.foreground': hex('fgDisabled'),
    'editorWidget.background': overlay,
    'editorWidget.foreground': hex('fg'),
    'editorWidget.border': hex('borderStrong'),
    'editorHoverWidget.background': overlay,
    'editorHoverWidget.border': hex('borderStrong'),
    'editorSuggestWidget.background': overlay,
    'editorSuggestWidget.border': hex('borderStrong'),
    'editorSuggestWidget.selectedBackground': hex('selected'),
    'editorSuggestWidget.highlightForeground': hex('fgAccent'),
    'input.background': hex('sunken'),
    'input.foreground': hex('fg'),
    'input.border': hex('border'),
    'input.placeholderForeground': hex('fgSubtle'),
    'inputOption.activeBorder': hex('accentBorder'),
    'inputOption.activeBackground': hex('accentSoft'),
    'inputOption.activeForeground': hex('fgAccent'),
    'inputValidation.errorBorder': hex('danger'),
    'toolbar.hoverBackground': hex('hover'),
    'toolbar.activeBackground': hex('active'),
    'menu.background': overlay,
    'menu.foreground': hex('fg'),
    'menu.border': hex('borderStrong'),
    'menu.selectionBackground': hex('selected'),
    'menu.selectionForeground': hex('fgStrong'),
    'menu.separatorBackground': hex('borderStrong'),
    'quickInput.background': overlay,
    'quickInput.foreground': hex('fg'),
    'quickInputList.focusBackground': hex('selected'),
    'list.hoverBackground': hex('hover'),
    'list.activeSelectionBackground': hex('selected'),
    'list.inactiveSelectionBackground': hex('selected'),
    'list.highlightForeground': hex('fgAccent'),
    'list.focusOutline': TRANSPARENT,
    'pickerGroup.foreground': hex('fgSubtle'),
    'pickerGroup.border': hex('border'),
    'progressBar.background': hex('accent'),
    'textLink.foreground': hex('syntaxLink'),
  }
}
