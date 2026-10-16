import { shell } from 'electron'

import type { UpdateService } from '../updates/update-service'
import { RELEASE_PAGE_URL } from '../updates/update.constants'
import { createGitHandlers } from './git-handlers'
import type { InvokeHandlers } from './handle'
import { createWorkspaceHandlers } from './workspace-handlers'
import type { HandlerContext } from './workspace-handlers'

type Services = HandlerContext & { updates: UpdateService }

/**
 * Связка каналов контракта с сервисами, по областям. Обработчик только разбирает
 * запрос и зовёт сервис: логика живёт в сервисах и модулях, не здесь.
 */
export const createInvokeHandlers = (services: Services): InvokeHandlers => {
  const { workspace, updates } = services

  return {
    ...createWorkspaceHandlers(services),
    ...createGitHandlers(workspace),

    'updates:getStatus': () => updates.getStatus(),
    'updates:install': () => updates.install(),
    'updates:dismiss': () => updates.dismiss(),
    'updates:openReleasePage': () => shell.openExternal(RELEASE_PAGE_URL),
  }
}
