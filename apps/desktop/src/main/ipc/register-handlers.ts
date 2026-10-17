import { shell } from 'electron'

import type { SearchService } from '../search/search-service'
import type { UpdateService } from '../updates/update-service'
import { RELEASE_PAGE_URL } from '../updates/update.constants'
import { createGitHandlers } from './git-handlers'
import type { InvokeHandlers } from './handle'
import { createSearchHandlers } from './search-handlers'
import { createWorkspaceHandlers } from './workspace-handlers'
import type { HandlerContext } from './workspace-handlers'

type Services = HandlerContext & { updates: UpdateService; search: SearchService }

/**
 * Связка каналов контракта с сервисами, по областям. Обработчик только разбирает
 * запрос и зовёт сервис: логика живёт в сервисах и модулях, не здесь.
 */
export const createInvokeHandlers = (services: Services): InvokeHandlers => {
  const { workspace, updates, search } = services

  return {
    ...createWorkspaceHandlers(services),
    ...createGitHandlers(workspace),
    ...createSearchHandlers(workspace, search),

    'updates:getStatus': () => updates.getStatus(),
    'updates:install': () => updates.install(),
    'updates:dismiss': () => updates.dismiss(),
    'updates:openReleasePage': () => shell.openExternal(RELEASE_PAGE_URL),
  }
}
