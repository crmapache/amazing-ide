import { join } from 'node:path'

import { shell, BrowserWindow } from 'electron'

import {
  MIN_WINDOW_SIZE,
  WINDOW_BACKGROUND,
  DEFAULT_WINDOW_SIZE,
  TRAFFIC_LIGHT_POSITION,
} from './main-window.constants'

const isExternalWebUrl = (url: string) => /^https?:\/\//.test(url)

/**
 * Главное окно IDE. Страница работает в песочнице без Node, а наружу ходит только
 * через мост preload. Ссылки на сайты открываются в браузере, а не внутри окна,
 * и никакая навигация не уводит окно со своей страницы.
 */
export const createMainWindow = (rendererUrl: string | undefined): BrowserWindow => {
  const window = new BrowserWindow({
    ...DEFAULT_WINDOW_SIZE,
    minWidth: MIN_WINDOW_SIZE.width,
    minHeight: MIN_WINDOW_SIZE.height,
    show: false,
    backgroundColor: WINDOW_BACKGROUND,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: TRAFFIC_LIGHT_POSITION,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  window.once('ready-to-show', () => window.show())

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalWebUrl(url)) void shell.openExternal(url)

    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event) => event.preventDefault())

  if (rendererUrl) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
