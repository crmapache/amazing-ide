import { ipcMain } from 'electron'

import type { InvokeChannel, InvokeRequest, InvokeResponse } from '@shared/ipc/contract'

import { isTrustedSender } from './trusted-sender'

export type InvokeHandler<C extends InvokeChannel> = (
  request: InvokeRequest<C>,
) => Promise<InvokeResponse<C>> | InvokeResponse<C>

/** Обработчики на весь контракт: пропущенный канал - ошибка компиляции. */
export type InvokeHandlers = { [C in InvokeChannel]: InvokeHandler<C> }

/** Регистрирует обработчики IPC. Запросы не из окна IDE отклоняются. */
export const registerInvokeHandlers = (
  handlers: InvokeHandlers,
  rendererUrl: string | undefined,
) => {
  for (const channel of Object.keys(handlers) as InvokeChannel[]) {
    const handler = handlers[channel] as (request: unknown) => unknown

    ipcMain.handle(channel, (event, request: unknown) => {
      if (!isTrustedSender(event.senderFrame, rendererUrl)) {
        throw new Error(`Запрос ${channel} не из окна IDE`)
      }

      return handler(request)
    })
  }
}
