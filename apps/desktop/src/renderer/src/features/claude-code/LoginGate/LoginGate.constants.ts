import { SECOND_MS } from '../claude.constants'

/** Как часто экран входа сам спрашивает, не вошёл ли аккаунт (один процесс `auth status`). */
export const SIGN_IN_RECHECK_MS = 30 * SECOND_MS
