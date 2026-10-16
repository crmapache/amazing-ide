import { join } from 'node:path'

import { app, BrowserWindow } from 'electron'

import type { WorkspaceState } from '@shared/workspace'

import { applyAppProfile, PROFILE_DIR_ENV } from './app-profile'
import { installApplicationMenu } from './menu'
import { broadcast } from './ipc/broadcast'
import { registerInvokeHandlers } from './ipc/handle'
import { createInvokeHandlers } from './ipc/register-handlers'
import { JsonFile } from './storage/json-file'
import { UpdateService } from './updates/update-service'
import { UPDATE_FEED_URL, UPDATE_FEED_OVERRIDE_ENV } from './updates/update.constants'
import { createMainWindow } from './window/main-window'
import { pickAndOpenProject } from './workspace/project-dialogs'
import { WorkspaceService } from './workspace/workspace-service'

/** В dev страницу отдаёт Vite (адрес передаёт electron-vite), в сборке - файл. */
const RENDERER_URL = app.isPackaged ? undefined : process.env['ELECTRON_RENDERER_URL']

const PROFILE_DIR = applyAppProfile()

// Порт отладки окна в dev: через него агент снимает скриншоты и кликает
// (scripts/cdp.mjs). В собранном приложении порт открывают флагом запуска.
const CDP_PORT = process.env['AMAZING_IDE_CDP_PORT']

if (!app.isPackaged && CDP_PORT) app.commandLine.appendSwitch('remote-debugging-port', CDP_PORT)

let mainWindow: BrowserWindow | null = null

const openMainWindow = () => {
  mainWindow = createMainWindow(RENDERER_URL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const bootstrap = async () => {
  const workspace = await WorkspaceService.load(
    new JsonFile<WorkspaceState>(join(app.getPath('userData'), 'workspace.json')),
    (state) => broadcast('workspace:changed', state),
  )
  const updates = new UpdateService({
    feedUrl: process.env[UPDATE_FEED_OVERRIDE_ENV] ?? UPDATE_FEED_URL,
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    executablePath: app.getPath('exe'),
    downloadsDir: app.getPath('temp'),
    logPath: join(app.getPath('logs'), 'update.log'),
    relaunchEnv: PROFILE_DIR ? `${PROFILE_DIR_ENV}=${PROFILE_DIR}` : '',
    onStatus: (status) => broadcast('updates:status', status),
    quit: () => app.quit(),
  })
  const services = { workspace, updates, getWindow: () => mainWindow }

  registerInvokeHandlers(createInvokeHandlers(services), RENDERER_URL)
  installApplicationMenu({ openProject: () => void pickAndOpenProject(services) })
  openMainWindow()
  updates.start()
}

// Второй экземпляр IDE не запускается, а поднимает окно первого: два процесса
// писали бы одно и то же состояние в userData наперегонки.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow?.isMinimized()) mainWindow.restore()
    mainWindow?.focus()
  })

  // На macOS приложение живёт без окон, пока его не закроют через Cmd+Q.
  app.on('window-all-closed', () => undefined)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openMainWindow()
  })

  app
    .whenReady()
    .then(bootstrap)
    .catch((error: unknown) => {
      console.error('[main] IDE не запустилась:', error)
      app.quit()
    })
}
