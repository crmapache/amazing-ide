import { Menu, BrowserWindow } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

import { broadcast } from './ipc/broadcast'
import { isPanelFocused } from './claude/tabs/panel-focus'

type MenuActions = {
  openProject: () => void
}

/**
 * ⌘W: фокус в правой панели Claude Code - закрыть вкладку разговора (решает панель:
 * под вопросом и меню клавиша молчит), иначе - окно. Меню забирает нажатие раньше
 * страницы, поэтому развилка здесь, а не в окне.
 */
const closeTabOrWindow = () => {
  if (isPanelFocused()) broadcast('claude:panelKey', 'closeTab')
  else BrowserWindow.getFocusedWindow()?.close()
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
 * роли: их клавиши в правой панели значат другое (closeTabOrWindow, reloadUnlessPanel).
 */
export const installApplicationMenu = ({ openProject }: MenuActions) => {
  const template: MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        { label: 'Open Project…', accelerator: 'CmdOrCtrl+O', click: openProject },
        { type: 'separator' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', click: closeTabOrWindow },
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
