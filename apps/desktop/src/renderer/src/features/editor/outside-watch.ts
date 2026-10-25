import { invoke } from '../../lib/ipc'
import { isOutsidePath } from '../../lib/path.utils'

/** Последний набор, ушедший главному процессу: тот же второй раз не шлётся. */
let sent = ''

/**
 * Сказать главному процессу, за какими файлами вне проекта следить: проект их не видит, а
 * агент пишет и туда. Набор - все открытые документы с абсолютным путём; их правки придут
 * обычным fs:changed. Не вышло - вкладка сверится по возврату в окно.
 */
export const watchOutsideFiles = (open: readonly { projectId: string; path: string }[]): void => {
  const files = open
    .filter((file) => isOutsidePath(file.path))
    .map(({ projectId, path }) => ({ projectId, path }))
  const key = files
    .map((file) => `${file.projectId}\n${file.path}`)
    .sort()
    .join('\0')

  if (key === sent) return

  sent = key
  invoke('fs:watchOutside', { files }).catch((error: unknown) => {
    console.warn('[editor] слежение за файлами вне проекта не включилось:', error)
  })
}
