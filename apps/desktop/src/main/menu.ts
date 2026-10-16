import { Menu } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

type MenuActions = {
  openProject: () => void
}

/**
 * Меню приложения. Стандартные разделы macOS (правка, вид, окно) дают системные
 * сочетания: копирование, вставку, полноэкранный режим. Свои пункты - только то,
 * что относится ко всей IDE, а не к одному виду.
 */
export const installApplicationMenu = ({ openProject }: MenuActions) => {
  const template: MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [{ label: 'Open Project…', accelerator: 'CmdOrCtrl+O', click: openProject }],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
