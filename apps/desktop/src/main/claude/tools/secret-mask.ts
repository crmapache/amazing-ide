import { SECRET_MASK, SECRET_NAME, SECRET_VALUE } from './tools.constants'

/** Флаг, за которым идёт ключ: --api-key, --token. */
const isSecretFlag = (arg: string) => /^--?[\w-]{2,}$/.test(arg) && SECRET_NAME.test(arg)

const maskSegment = (segment: string) => (SECRET_VALUE.test(segment) ? SECRET_MASK : segment)

/** Схема, хост и путь без похожих на ключ кусков; не адрес - null. */
const safeUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    const path = url.pathname.split('/').map(maskSegment).join('/')

    return `${url.protocol}//${url.host}${path === '/' ? '' : path}`
  } catch {
    return null
  }
}

/**
 * Текст CLI для окна (ошибка сервера, вывод команды): адреса внутри - как maskUrl,
 * пары «ключ=значение» и «ключ: значение», Bearer и ключи сами по себе - маской.
 */
export const maskText = (text: string): string =>
  text
    .replace(/\b[a-z][\w+.-]*:\/\/[^\s"'<>]+/gi, (url) => safeUrl(url) ?? SECRET_MASK)
    .replace(/\b(bearer)\s+[\w.~+/-]+=*/gi, `$1 ${SECRET_MASK}`)
    .replace(
      /\b([\w.-]*?(?:key|token|secret|passw(?:or)?d|credential)[\w.-]*)(\s*[=:]\s*)("?)[^\s"',;]+\3/gi,
      `$1$2$3${SECRET_MASK}$3`,
    )
    .replace(/[\w-]{24,}/g, maskSegment)

/**
 * Адрес для окна: схема, хост и путь, где похожие на ключ куски заменены (как у
 * Zapier: …/mcp/<ключ>/sse). Логин и пароль (`user:token@`), строка запроса и якорь
 * не уходят никогда: там ключи чаще всего.
 */
export const maskUrl = (value: string): string => safeUrl(value) ?? maskText(value)

/** Один аргумент команды: адрес, пара «ИМЯ=значение», значение ключевого флага или ключ сам по себе. */
const maskArg = (arg: string, previous: string | undefined) => {
  if (previous !== undefined && isSecretFlag(previous) && !arg.startsWith('-')) return SECRET_MASK
  if (/^[a-z][\w+.-]*:\/\//i.test(arg)) return maskUrl(arg)

  const [, dashes = '', name = '', value] = /^(--?)?([\w.-]+)=(.*)$/.exec(arg) ?? []

  if (value !== undefined && SECRET_NAME.test(name)) return `${dashes}${name}=${SECRET_MASK}`

  return maskSegment(arg)
}

/**
 * Аргументы команды stdio-сервера для окна. Инструкции многих серверов советуют
 * класть ключ прямо в аргументы (`--api-key …`, `TOKEN=…`), а экран MCP видят на
 * демонстрации экрана и на скриншотах.
 */
export const maskArgs = (args: readonly string[]): string[] =>
  args.map((arg, index) => maskArg(arg, args[index - 1]))
