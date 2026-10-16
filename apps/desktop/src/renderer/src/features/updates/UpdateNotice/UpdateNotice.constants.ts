import type { UpdateFailureReason } from '@shared/updates'

/**
 * Сбои, после которых есть смысл попробовать ещё раз: сеть могла вернуться, папка -
 * освободиться. Не та подпись или не тот файл от повтора не изменятся.
 */
export const RETRYABLE_FAILURES: ReadonlySet<UpdateFailureReason> = new Set(['download', 'install'])
