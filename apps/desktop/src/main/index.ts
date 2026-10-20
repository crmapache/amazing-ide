import { join } from 'node:path'

import { app, shell, BrowserWindow } from 'electron'

import type { WorkspaceState } from '@shared/workspace'

import { applyAppProfile, PROFILE_DIR_ENV } from './app-profile'
import { installApplicationMenu } from './menu'
import { ClaudeService } from './claude/claude-service'
import type { StoredClaude } from './claude/claude-state'
import { ProjectWatchers } from './fs/project-watchers'
import { GitStatusService } from './git/git-status-service'
import { broadcast } from './ipc/broadcast'
import { registerInvokeHandlers } from './ipc/handle'
import { createInvokeHandlers } from './ipc/register-handlers'
import { SearchService } from './search/search-service'
import { JsonFile } from './storage/json-file'
import { UpdateService } from './updates/update-service'
import { UPDATE_FEED_URL, UPDATE_FEED_OVERRIDE_ENV } from './updates/update.constants'
import { createMainWindow } from './window/main-window'
import { openExternalWeb } from './window/open-external'
import { pickAndOpenProject } from './workspace/project-dialogs'
import { WorkspaceService } from './workspace/workspace-service'
import type { StoredAccounts } from './claude/accounts/account-store'
import { locateClaudeCli } from './claude/cli/cli-locator'
import { ProcessGroup } from './claude/cli/process-group'
import { SearchDesk } from './claude/search/search-desk'
import { SEARCH_DIR_NAME } from './claude/search/search.constants'

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
  // Поиску по разговорам - что проекты открыли и закрыли: он поднимается позже, после
  // разговоров.
  let onWorkspace = (): void => undefined
  const workspace = await WorkspaceService.load(
    new JsonFile<WorkspaceState>(join(app.getPath('userData'), 'workspace.json')),
    (state) => {
      broadcast('workspace:changed', state)
      onWorkspace()
    },
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
  const search = new SearchService()
  const claude = await ClaudeService.load(
    new JsonFile<StoredClaude>(join(app.getPath('userData'), 'claude.json')),
    {
      onState: (state) => broadcast('claude:state', state),
      onFeed: (patch) => broadcast('claude:feed', patch),
      onCall: (call) => broadcast('claude:call', call),
      openExternal: openExternalWeb,
      openPath: (path) => shell.openPath(path),
    },
    {
      file: new JsonFile<StoredAccounts>(join(app.getPath('userData'), 'claude-accounts.json')),
      dir: join(app.getPath('userData'), 'claude-accounts'),
    },
  )
  // Вопрос сбоку (/btw): цепочка вкладки - окну событием, ответы приходят сами.
  claude.panel.aside.onChange = (view) => broadcast('claudePanel:aside', view)
  // Поиск по разговорам панели - своим модулем (main/claude/search): индекс по проекту,
  // первая сборка - через 20 секунд после открытия проекта, поиск модели - на аккаунте панели.
  const conversationSearch = new SearchDesk({
    dir: join(app.getPath('userData'), SEARCH_DIR_NAME),
    cli: async () => {
      const cli = await locateClaudeCli()

      return cli && { ...cli, env: claude.accounts.envFor(cli.env) }
    },
    onStep: (step) => broadcast('claudeSearch:step', step),
  })
  const searchProjects = () =>
    conversationSearch.projectsChanged(
      workspace.getState().projects.map((project) => project.rootPath),
    )

  // Слежение за диском открытых проектов: окну - что перечитать в дереве и что .git
  // поменялся (ветка), статусу git - повод перечитаться и разослать себя, если стал другим.
  const gitStatus = new GitStatusService((projectId, status) =>
    broadcast('git:status', { projectId, status }),
  )
  const watchers = new ProjectWatchers((projectId, { directories, renamed, paths, git }) => {
    if (directories === null || directories.length > 0 || git) {
      broadcast('fs:changed', { projectId, directories, renamed, git })
    }

    gitStatus.changed(projectId, { git, paths })
  })
  const watchProjects = () => {
    for (const projectId of watchers.sync(workspace.getState().projects)) {
      gitStatus.forget(projectId)
    }
  }

  searchProjects()
  watchProjects()
  onWorkspace = () => {
    searchProjects()
    watchProjects()
  }

  const services = {
    workspace,
    updates,
    search,
    claude,
    gitStatus,
    conversationSearch,
    getWindow: () => mainWindow,
  }

  // Процессы CLI и команды «!» - дети IDE: уходят вместе с ней, а не висят сиротами. Выход ждёт,
  // пока они закроются, - иначе таймер добивания умер бы вместе с главным процессом.
  let quitting: 'no' | 'waiting' | 'ready' = 'no'

  app.on('before-quit', (event) => {
    if (quitting === 'ready') return

    event.preventDefault()

    if (quitting === 'waiting') return

    quitting = 'waiting'
    conversationSearch.dispose()
    watchers.dispose()
    void claude.shutdown().finally(() => {
      quitting = 'ready'
      app.quit()
    })
  })
  // Последняя страховка: главный процесс уходит, не дождавшись (сбой, kill).
  process.on('exit', () => ProcessGroup.killAllNow())

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
