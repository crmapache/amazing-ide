import { shell } from 'electron'

/** Адрес сайта: http или https. Остальные схемы (file, smb, чужие приложения) - не открывать. */
export const isExternalWebUrl = (url: string): boolean => {
  try {
    const { protocol } = new URL(url)

    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Открыть адрес в браузере человека - единственный путь наружу для ссылок из окна и
 * адресов от CLI (вход в MCP-сервер). Адрес входа диктует сам сервер, а сервер может
 * прийти из .mcp.json чужого репозитория: file:// запустил бы файл, smb:// смонтировал
 * бы шару. Не сайт - отказ и запись в журнал.
 */
export const openExternalWeb = (url: string): boolean => {
  if (!isExternalWebUrl(url)) {
    console.warn('[window] не открываю адрес с чужой схемой:', url.slice(0, 200))

    return false
  }

  void shell.openExternal(url)

  return true
}
