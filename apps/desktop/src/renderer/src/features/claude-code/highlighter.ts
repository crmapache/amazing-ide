import type { ThemedToken, HighlighterCore } from 'shiki/core'

/** Тема на CSS-переменных: цвет токена - роль `--color-syntax-*` (ADR 0009). */
const THEME = 'amazing-ide'

/**
 * Грамматики грузятся по одной, когда язык впервые встретился в ответе: shiki целиком -
 * мегабайты, а в разговоре обычно три-четыре языка. Имена путей статичные, чтобы
 * сборщик разложил каждую грамматику в свой кусок.
 */
const GRAMMARS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsonc: () => import('shiki/langs/jsonc.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  scss: () => import('shiki/langs/scss.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  kotlin: () => import('shiki/langs/kotlin.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  swift: () => import('shiki/langs/swift.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  dockerfile: () => import('shiki/langs/dockerfile.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  ruby: () => import('shiki/langs/ruby.mjs'),
  graphql: () => import('shiki/langs/graphql.mjs'),
  prisma: () => import('shiki/langs/prisma.mjs'),
}

/** Как языки пишут в заборе кода и в расширениях файлов. */
const ALIASES: Record<string, string> = {
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  zsh: 'bash',
  console: 'bash',
  py: 'python',
  yml: 'yaml',
  md: 'markdown',
  kt: 'kotlin',
  kts: 'kotlin',
  rs: 'rust',
  rb: 'ruby',
  cs: 'csharp',
  'c++': 'cpp',
  hpp: 'cpp',
  h: 'c',
  svg: 'xml',
  patch: 'diff',
  docker: 'dockerfile',
  gql: 'graphql',
}

let highlighter: Promise<HighlighterCore> | null = null

/** Язык подсветки по имени из забора или по расширению файла. null - не знаем такого. */
export const resolveLanguage = (name: string): string | null => {
  const key = name.trim().toLowerCase()
  const language = ALIASES[key] ?? key

  return language in GRAMMARS ? language : null
}

const getHighlighter = () => {
  highlighter ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(
    ([core, engine]) =>
      core.createHighlighterCore({
        themes: [core.createCssVariablesTheme({ name: THEME, variablePrefix: '--shiki-' })],
        langs: [],
        // Движок регулярных выражений на JS: WASM-движку окну пришлось бы ослабить CSP.
        engine: engine.createJavaScriptRegexEngine(),
      }),
  )

  return highlighter
}

/**
 * Код по строкам и токенам с ролью цвета в каждом. null - язык неизвестен, код
 * показывается без подсветки.
 */
export const highlightCode = async (
  code: string,
  name: string,
): Promise<ThemedToken[][] | null> => {
  const language = resolveLanguage(name)
  const grammar = language ? GRAMMARS[language] : undefined

  if (!language || !grammar) return null

  const shiki = await getHighlighter()

  if (!shiki.getLoadedLanguages().includes(language)) {
    await shiki.loadLanguage(grammar() as Parameters<HighlighterCore['loadLanguage']>[0])
  }

  return shiki.codeToTokens(code, { lang: language, theme: THEME }).tokens
}

/** Роль цвета из токена shiki: `var(--shiki-token-keyword)` - `token-keyword`. */
export const tokenRole = (color: string | undefined): string =>
  /--shiki-([\w-]+)/.exec(color ?? '')?.[1] ?? 'foreground'
