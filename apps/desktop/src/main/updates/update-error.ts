import type { UpdateFailureReason } from '@shared/updates'

/**
 * Ошибка обновления с причиной, понятной окну. message - для журнала, человеку
 * окно показывает свой перевод по reason.
 */
export class UpdateError extends Error {
  constructor(
    readonly reason: UpdateFailureReason,
    message: string,
  ) {
    super(message)
    this.name = 'UpdateError'
  }
}
