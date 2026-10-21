import { Menu, BrowserWindow } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

import { broadcast } from './ipc/broadcast'
import { isPanelFocused } from './claude/tabs/panel-focus'

type MenuActions = {
  openProject: () => void
}

/**
 * ⌘W закрывает вкладку, как в WebStorm, а не окно: фокус в правой панели Claude Code -
 * вкладку разговора (решает панель: под вопросом и меню клавиша молчит), иначе - файл в
 * редакторе. Меню забирает нажатие раньше страницы, поэтому развилка здесь, а не в окне.
 * Окно закрывается кнопкой в шапке, IDE - ⌘Q.
 */
const closeTab = () => {
  if (isPanelFocused()) broadcast('claude:panelKey', 'closeTab')
  else broadcast('editor:command', 'closeTab')
}

/**
 * ⌘R перезагружает окно - но не из панели: там это рефлекс из других программ, а
 * перезагрузка посреди набора сбросила бы окно целиком.
 */
const reloadUnlessPanel = () => {
  if (!isPanelFocused()) BrowserWindow.getFocusedWindow()?.webContents.reload()
}

/**
 * Меню приложения. Стандартные разделы macOS (правка, вид, окно) дают системные
 * сочетания: копирование, вставку, полноэкранный режим. Свои пункты - только то,
 * что относится ко всей IDE, а не к одному виду. Закрытие и перезагрузка - свои, а не
 * роли: их клавиши значат другое (closeTab, reloadUnlessPanel).
 */
export const installApplicationMenu = ({ openProject }: MenuActions) => {
  const template: MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        { label: 'Open Project…', accelerator: 'CmdOrCtrl+O', click: openProject },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: closeTab },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: reloadUnlessPanel },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
