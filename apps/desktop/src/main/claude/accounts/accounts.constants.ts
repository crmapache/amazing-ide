/** Как часто спрашивать хранилище, вошёл ли CLI, пока идёт вход в Терминале. */
export const SIGN_IN_POLL_MS = 3_000

/** Сколько ждать входа: дальше черновик и его хранилище удаляются. */
export const SIGN_IN_TIMEOUT_MS = 10 * 60 * 1000

/** Переменная CLI «где всё остальное» - только для вопроса «кто вошёл», не для разговора. */
export const CONFIG_VARIABLE = 'CLAUDE_CONFIG_DIR'

/** Сколько ждать ответа о профиле, сколько - записи профиля после ответа и как часто смотреть. */
export const IDENTITY_TIMEOUT_MS = 20_000
export const IDENTITY_WRITE_MS = 5_000
export const IDENTITY_POLL_MS = 250

/** Код `security delete-generic-password`, когда записи нет: удалять было нечего. */
export const KEYCHAIN_NOT_FOUND = 44
