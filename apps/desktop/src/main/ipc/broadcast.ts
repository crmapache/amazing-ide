import { BrowserWindow } from 'electron'

import type { EventChannel, EventPayload } from '@shared/ipc/contract'

/** Отправляет событие из контракта во все открытые окна. */
export const broadcast = <E extends EventChannel>(event: E, payload: EventPayload<E>) => {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(event, payload)
  }
}
