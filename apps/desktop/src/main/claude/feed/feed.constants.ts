/**
 * Сколько символов вывода инструмента держать в ленте. Read отдаёт файл целиком, Bash -
 * всё, что напечатала команда; в окне такую простыню никто не читает, а каждая
 * правка ленты гонит её через IPC.
 */
export const MAX_RESULT_CHARS = 24_000

/** Сколько строк диффа правки держать: больше в карточке не прочитать. */
export const MAX_PATCH_LINES = 1_500

/** Заглушка CLI на месте пустого ответа - в ленту не идёт. */
export const EMPTY_TEXT_PLACEHOLDER = '(no content)'

/**
 * Повтор запроса к API, прошедший быстрее этого, следа в ленте не оставляет: это была
 * заминка, а не событие (как в ACC).
 */
export const RETRY_TRACE_MS = 5_000

/** Состояния лимита, при которых работа идёт как обычно: строки LIMIT нет. */
export const ALLOWED_RATE_LIMIT = new Set(['allowed', 'allowed_warning', 'ok'])

/**
 * Причины «быстрый режим выключен», которые не отказ: его не просили или CLI ещё
 * проверяет.
 */
export const FAST_QUIET_REASONS = new Set(['sdk_opt_in_required', 'pending'])

/**
 * Подтипы, которыми CLI объявляет, что сам перевёл разговор на другую модель: защита
 * модели отметила сообщение, или модели нужна доплата либо согласие.
 */
export const MODEL_FALLBACK_SUBTYPES = new Set(['model_refusal_fallback', 'model_consent_fallback'])
