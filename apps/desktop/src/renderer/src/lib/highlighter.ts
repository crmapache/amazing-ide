import type { ThemedToken, HighlighterCore } from 'shiki/core'

import { SYNTAX_THEME, LINE_TIME_LIMIT_MS, MAX_HIGHLIGHTED_LINE } from './highlighter.constants'
import type { LineToken, LineHighlighter } from './highlighter.types'
import { GRAMMARS, EMBEDDED_FIRST } from './syntax-grammars.constants'
import { resolveLanguage } from './syntax-languages.utils'

/**
 * Подсветка кода shiki - одна на окно: блоки кода в ответах Claude Code и редактор файлов
 * берут один экземпляр и одни загруженные грамматики, поэтому код окрашен одинаково и
 * каждая грамматика грузится один раз.
 */
let highlighter: Promise<HighlighterCore> | null = null

const getHighlighter = () => {
  highlighter ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(
    ([core, engine]) =>
      core.createHighlighterCore({
        themes: [core.createCssVariablesTheme({ name: SYNTAX_THEME, variablePrefix: '--shiki-' })],
        langs: [],
        // Движок регулярных выражений на JS: WASM-движку окну пришлось бы ослабить CSP.
        engine: engine.createJavaScriptRegexEngine(),
      }),
  )

  return highlighter
}

/** Подсветка с загруженной грамматикой языка. null - такого языка нет в GRAMMARS. */
const withLanguage = async (language: string): Promise<HighlighterCore | null> => {
  const grammar = GRAMMARS[language]

  if (!grammar) return null

  const shiki = await getHighlighter()

  if (!shiki.getLoadedLanguages().includes(language)) {
    await Promise.all((EMBEDDED_FIRST[language] ?? []).map(withLanguage))
    await shiki.loadLanguage(grammar() as Parameters<HighlighterCore['loadLanguage']>[0])
  }

  return shiki
}

/**
 * Загрузить грамматику заранее - до того, как редактор покажет файл: иначе первый кадр
 * выходит без цвета, а файл, открытый на далёкой строке, красится только фоном.
 */
export const preloadLanguage = async (language: string): Promise<void> => {
  await withLanguage(language)
}

/** Роль цвета из токена shiki: `var(--shiki-token-keyword)` - `token-keyword`. */
export const tokenRole = (color: string | undefined): string =>
  /--shiki-([\w-]+)/.exec(color ?? '')?.[1] ?? 'foreground'

/**
 * Код по строкам и токенам с ролью цвета в каждом. null - язык неизвестен, код
 * показывается без подсветки.
 */
export const highlightCode = async (
  code: string,
  name: string,
): Promise<ThemedToken[][] | null> => {
  const language = resolveLanguage(name)
  const shiki = language ? await withLanguage(language) : null

  if (!language || !shiki) return null

  return shiki.codeToTokens(code, { lang: language, theme: SYNTAX_THEME }).tokens
}

/**
 * Построчная подсветка языка для редактора: те же грамматика и роли, что у блоков кода,
 * но строка за строкой, со стеком правил между ними. Соседние куски одной роли и
 * начертания склеиваются - редактору меньше работы. null - языка нет в GRAMMARS.
 */
export const createLineHighlighter = async (language: string): Promise<LineHighlighter | null> => {
  const shiki = await withLanguage(language)

  if (!shiki) return null

  const [{ INITIAL, EncodedTokenMetadata }, grammar] = await Promise.all([
    import('shiki/textmate'),
    Promise.resolve(shiki.getLanguage(language)),
  ])
  // Цвета-переменные shiki держит в таблице цветов заглушками (#00000007) и помнит, что за
  // ними стоит: роль берётся по замене, без неё любой токен вышел бы ровным текстом.
  const { theme, colorMap } = shiki.setTheme(SYNTAX_THEME)
  const replacements = theme.colorReplacements ?? {}
  const roles = colorMap.map((color) => tokenRole(replacements[color?.toLowerCase() ?? '']))

  return {
    initial: INITIAL,
    tokenizeLine: (line, state) => {
      if (line.length > MAX_HIGHLIGHTED_LINE) {
        return { tokens: [{ start: 0, role: 'foreground', fontStyle: 0 }], state }
      }

      const result = grammar.tokenizeLine2(line, state, LINE_TIME_LIMIT_MS)
      const tokens: LineToken[] = []

      for (let index = 0; index < result.tokens.length; index += 2) {
        const metadata = result.tokens[index + 1] ?? 0
        const role = roles[EncodedTokenMetadata.getForeground(metadata)] ?? 'foreground'
        const fontStyle = EncodedTokenMetadata.getFontStyle(metadata)
        const last = tokens.at(-1)

        if (last?.role === role && last.fontStyle === fontStyle) continue

        tokens.push({ start: result.tokens[index] ?? 0, role, fontStyle })
      }

      // Не успела за предел - следующая строка начинает с прежнего стека, а не с обрывка.
      return { tokens, state: result.stoppedEarly ? state : result.ruleStack }
    },
  }
}
