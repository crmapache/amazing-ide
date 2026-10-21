import type { languages } from 'monaco-editor/editor/editor.api.js'

type LanguageConfiguration = languages.LanguageConfiguration

type ConfModule = { conf: LanguageConfiguration }

const PAIRS = [
  { open: '{', close: '}' },
  { open: '[', close: ']' },
  { open: '(', close: ')' },
  { open: '"', close: '"' },
  { open: "'", close: "'" },
]

const BRACKETS: languages.CharacterPair[] = [
  ['{', '}'],
  ['[', ']'],
  ['(', ')'],
]

/** Скобки и кавычки без комментариев: CSV, журналы, диффы. */
const PLAIN: LanguageConfiguration = {
  brackets: BRACKETS,
  autoClosingPairs: PAIRS,
  surroundingPairs: PAIRS,
}

/** Комментарий решёткой: TOML, .env, Makefile, nginx, ssh config. */
const HASH: LanguageConfiguration = { ...PLAIN, comments: { lineComment: '#' } }

/** Комментарии как в C: JSON с комментариями, Prisma, Zig. */
const C_LIKE: LanguageConfiguration = {
  ...PLAIN,
  comments: { lineComment: '//', blockComment: ['/*', '*/'] },
}

const own = (conf: LanguageConfiguration) => () => Promise.resolve({ conf })

/**
 * Как языку редактора комментировать строку (⌘/), какие скобки парные и закрываются
 * сами, как отступать после Enter. Подсветку даёт shiki, а это - готовые конфигурации
 * языков Monaco (грузятся по одной, при первом файле языка). Для языков, которых в
 * Monaco нет, - свои, по виду комментариев. Нет в списке - ничего, кроме подсветки.
 */
export const LANGUAGE_CONFIGURATIONS: Readonly<Record<string, () => Promise<ConfModule>>> = {
  typescript: () => import('monaco-editor/languages/definitions/typescript/typescript.js'),
  tsx: () => import('monaco-editor/languages/definitions/typescript/typescript.js'),
  javascript: () => import('monaco-editor/languages/definitions/javascript/javascript.js'),
  jsx: () => import('monaco-editor/languages/definitions/javascript/javascript.js'),
  markdown: () => import('monaco-editor/languages/definitions/markdown/markdown.js'),
  mdx: () => import('monaco-editor/languages/definitions/mdx/mdx.js'),
  html: () => import('monaco-editor/languages/definitions/html/html.js'),
  vue: () => import('monaco-editor/languages/definitions/html/html.js'),
  svelte: () => import('monaco-editor/languages/definitions/html/html.js'),
  astro: () => import('monaco-editor/languages/definitions/html/html.js'),
  xml: () => import('monaco-editor/languages/definitions/xml/xml.js'),
  css: () => import('monaco-editor/languages/definitions/css/css.js'),
  scss: () => import('monaco-editor/languages/definitions/scss/scss.js'),
  sass: () => import('monaco-editor/languages/definitions/scss/scss.js'),
  less: () => import('monaco-editor/languages/definitions/less/less.js'),
  yaml: () => import('monaco-editor/languages/definitions/yaml/yaml.js'),
  ini: () => import('monaco-editor/languages/definitions/ini/ini.js'),
  shellscript: () => import('monaco-editor/languages/definitions/shell/shell.js'),
  shellsession: () => import('monaco-editor/languages/definitions/shell/shell.js'),
  fish: () => import('monaco-editor/languages/definitions/shell/shell.js'),
  powershell: () => import('monaco-editor/languages/definitions/powershell/powershell.js'),
  bat: () => import('monaco-editor/languages/definitions/bat/bat.js'),
  docker: () => import('monaco-editor/languages/definitions/dockerfile/dockerfile.js'),
  sql: () => import('monaco-editor/languages/definitions/sql/sql.js'),
  graphql: () => import('monaco-editor/languages/definitions/graphql/graphql.js'),
  python: () => import('monaco-editor/languages/definitions/python/python.js'),
  go: () => import('monaco-editor/languages/definitions/go/go.js'),
  rust: () => import('monaco-editor/languages/definitions/rust/rust.js'),
  java: () => import('monaco-editor/languages/definitions/java/java.js'),
  kotlin: () => import('monaco-editor/languages/definitions/kotlin/kotlin.js'),
  groovy: () => import('monaco-editor/languages/definitions/java/java.js'),
  scala: () => import('monaco-editor/languages/definitions/scala/scala.js'),
  swift: () => import('monaco-editor/languages/definitions/swift/swift.js'),
  'objective-c': () => import('monaco-editor/languages/definitions/objective-c/objective-c.js'),
  'objective-cpp': () => import('monaco-editor/languages/definitions/objective-c/objective-c.js'),
  c: () => import('monaco-editor/languages/definitions/cpp/cpp.js'),
  cpp: () => import('monaco-editor/languages/definitions/cpp/cpp.js'),
  csharp: () => import('monaco-editor/languages/definitions/csharp/csharp.js'),
  php: () => import('monaco-editor/languages/definitions/php/php.js'),
  ruby: () => import('monaco-editor/languages/definitions/ruby/ruby.js'),
  lua: () => import('monaco-editor/languages/definitions/lua/lua.js'),
  dart: () => import('monaco-editor/languages/definitions/dart/dart.js'),
  elixir: () => import('monaco-editor/languages/definitions/elixir/elixir.js'),
  clojure: () => import('monaco-editor/languages/definitions/clojure/clojure.js'),
  perl: () => import('monaco-editor/languages/definitions/perl/perl.js'),
  r: () => import('monaco-editor/languages/definitions/r/r.js'),
  solidity: () => import('monaco-editor/languages/definitions/solidity/solidity.js'),
  terraform: () => import('monaco-editor/languages/definitions/hcl/hcl.js'),
  hcl: () => import('monaco-editor/languages/definitions/hcl/hcl.js'),
  proto: () => import('monaco-editor/languages/definitions/protobuf/protobuf.js'),
  handlebars: () => import('monaco-editor/languages/definitions/handlebars/handlebars.js'),
  json: own(C_LIKE),
  jsonc: own(C_LIKE),
  json5: own(C_LIKE),
  jsonl: own(PLAIN),
  prisma: own(C_LIKE),
  zig: own(C_LIKE),
  toml: own(HASH),
  dotenv: own(HASH),
  make: own(HASH),
  cmake: own(HASH),
  nginx: own(HASH),
  'ssh-config': own(HASH),
  nix: own(HASH),
  codeowners: own(HASH),
  'git-commit': own(HASH),
  'git-rebase': own(HASH),
  haskell: own({ ...PLAIN, comments: { lineComment: '--', blockComment: ['{-', '-}'] } }),
  erlang: own({ ...PLAIN, comments: { lineComment: '%' } }),
  latex: own({ ...PLAIN, comments: { lineComment: '%' } }),
  viml: own({ ...PLAIN, comments: { lineComment: '"' } }),
  jinja: own({ ...PLAIN, comments: { blockComment: ['{#', '#}'] } }),
  diff: own(PLAIN),
  http: own(PLAIN),
  csv: own(PLAIN),
  tsv: own(PLAIN),
  log: own(PLAIN),
}
