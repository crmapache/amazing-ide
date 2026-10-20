/**
 * MCP-серверы и плагины Claude Code - экраны панели. Состояние серверов знает живой
 * процесс CLI разговора (mcp_status), конфиг и плагины меняют разовые команды CLI.
 */

/** Состояние сервера словами CLI. unknown - CLI назвал то, чего панель не знает. */
export type McpStatus = 'connected' | 'pending' | 'failed' | 'needs-auth' | 'disabled' | 'unknown'

/** Где настроен сервер - на экране это группы. */
export const MCP_SCOPES = ['project', 'local', 'user', 'claudeai', 'managed', 'dynamic'] as const

export type McpScope = (typeof MCP_SCOPES)[number] | 'other'

/** Куда сервер можно добавить: `claude mcp add -s`. */
export const MCP_ADD_SCOPES = ['local', 'project', 'user'] as const

export type McpAddScope = (typeof MCP_ADD_SCOPES)[number]

export const MCP_TRANSPORTS = ['stdio', 'http', 'sse'] as const

export type McpTransport = (typeof MCP_TRANSPORTS)[number]

export type McpServer = {
  name: string
  status: McpStatus
  scope: McpScope
  /** stdio, http, sse, claudeai-proxy, sdk - как назвал CLI. */
  transport: string
  /**
   * Команда или адрес - без переменных окружения, заголовков и строки запроса, ключи в
   * аргументах и в пути адреса замаскированы: окну они не нужны.
   */
  target: string
  /** Почему не подключился - текстом CLI, ключи в нём замаскированы. */
  error: string
  toolCount: number
  /** Удалить можно только своё: из проекта, локальное, пользовательское. */
  removable: boolean
}

/**
 * Почему список или действие не вышли - кодом, слова у окна. untrusted, cli-not-found,
 * project-missing - причины разговора; process-exited - процесс CLI закрылся, не
 * ответив; refused - CLI отказал (его текст - в detail); unsafe-url - адрес входа не
 * сайт; bad-command - в строке команды незакрытая кавычка; failed - прочее.
 */
export const TOOLS_FAILURES = [
  'untrusted',
  'cli-not-found',
  'project-missing',
  'process-exited',
  'refused',
  'unsafe-url',
  'bad-command',
  'failed',
] as const

export type ToolsFailure = (typeof TOOLS_FAILURES)[number]

/** Список серверов проекта; failure - почему его не спросить. */
export type McpListing = { servers: McpServer[]; failure: ToolsFailure | null; detail: string }

export type McpAction = 'reconnect' | 'enable' | 'disable' | 'authenticate'

export type McpAddRequest = {
  name: string
  transport: McpTransport
  /** stdio - строка команды, http и sse - адрес. */
  target: string
  scope: McpAddScope
}

/**
 * Итог действия с сервером или плагином: удалось ли, почему нет и что сказал CLI.
 * needsConsent - установка запускает команду маркетплейса и ждёт явного согласия
 * (флаг --yes).
 */
export type ToolsResult = {
  ok: boolean
  failure: ToolsFailure | null
  /** Текст CLI, ключи замаскированы: при успехе - его отчёт, при отказе - ошибка. */
  detail: string
  needsConsent: boolean
  /** Вход в MCP-сервер: browser - открыт браузер, done - входить не нужно. */
  signIn?: 'browser' | 'done' | undefined
}

/** Действие с серверами и список после него: окно кладёт его в кэш, а не переспрашивает. */
export type McpOutcome = { result: ToolsResult; listing: McpListing }

/** Области плагинов: `claude plugin … -s`. */
export const PLUGIN_SCOPES = ['user', 'project', 'local', 'managed'] as const

export type PluginScope = (typeof PLUGIN_SCOPES)[number]

export type InstalledPlugin = {
  id: string
  name: string
  marketplace: string
  version: string
  /** Пусто - CLI назвал область, которой панель не знает. */
  scope: PluginScope | ''
  enabled: boolean
}

export type AvailablePlugin = {
  id: string
  name: string
  marketplace: string
  description: string
  installCount: number
}

/** Маркетплейс: имя и откуда он - без логина и токена из адреса частного репозитория. */
export type Marketplace = { name: string; source: string }

export type PluginCatalog = {
  installed: InstalledPlugin[]
  /** Каталог маркетплейсов: самые устанавливаемые первыми. */
  available: AvailablePlugin[]
  marketplaces: Marketplace[]
  /** Почему каталог не прочитался; текст CLI - в detail. */
  failure: ToolsFailure | null
  detail: string
}

/** Действие с плагинами и каталог после него. */
export type PluginsOutcome = { result: ToolsResult; catalog: PluginCatalog }

export type PluginAction = 'install' | 'uninstall' | 'enable' | 'disable' | 'update'
