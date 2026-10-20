/**
 * Сколько ждать ответа на вопрос сбоку: столько же ждёт мост самого CLI (660 с, замер
 * ACC на 2.1.280). Остальные служебные запросы CLI отвечает из памяти, этот - вызов
 * модели по всему разговору, и на длинном разговоре минута - обычный ответ.
 */
export const ASIDE_TIMEOUT_MS = 660_000

/** Подтип служебного запроса и строки его прогресса. */
export const ASIDE_SUBTYPE = 'side_question'
export const ASIDE_PROGRESS = 'control_request_progress'

/** Слова CLI об отменённом вопросе: другого признака отмены в ответе нет. */
export const ASIDE_CANCELLED = 'Side question cancelled'

/** Самый длинный вопрос и ответ, которые уходят CLI. */
export const ASIDE_TEXT_LIMIT = 20_000

/** Сколько вопросов держит цепочка вкладки и сколько прошлых ответов едет с новым. */
export const ASIDE_THREAD_KEPT = 20
export const ASIDE_HISTORY_SENT = 10

/** Подтипы строк потока, которыми CLI говорит от имени мода (2.1.287+). */
export const MOD_STATUS = 'ui_status'
export const MOD_PANES = 'ui_panes'
export const MOD_TOAST = 'ui_toast'
export const MOD_LOG = 'ui_log'
export const MOD_PREFIX = 'ui_'

/** Сколько висит всплывашка мода, если мод не сказал: те же 4 с, что у CLI. */
export const MOD_TOAST_MS = 4000

/**
 * Номер вопроса мода ($.ui.ask): CLI даёт его сам, у вызовов API он всегда `toolu_01`,
 * `toolu_vrtx_` или `toolu_bdrk_` (замер ACC на 2.1.293).
 */
export const MOD_QUESTION_PREFIX = 'toolu_plugin_'

/** Слово CLI в ответе-заглушке, когда ход отказал лимит. */
export const LIMIT_REFUSAL = 'rate_limit'

/**
 * Продолжение после лимита: в момент сброса плюс запас на часы сервера (ранний запрос
 * получит тот же отказ); сброс не назван - через 15 минут, но не раньше минуты.
 */
export const RESET_SLACK_MS = 30_000
export const UNKNOWN_RESET_MS = 15 * 60 * 1000
export const MIN_WAIT_MS = 60 * 1000

/**
 * Дольше шести часов лимит не ждём: пятичасовое окно влезает всегда, недельные - нет,
 * а через дни вкладка - старая работа, и план начал бы её из ниоткуда.
 */
export const LIMIT_WAIT_MS = 6 * 60 * 60 * 1000

/** Сколько своих продолжений подряд лимит может отказать, прежде чем вкладка остаётся человеку. */
export const LIMIT_TRIES = 3

/**
 * Сколько фоновые агенты могут молчать и всё ещё считаться работой: полчаса, как сон
 * простаивающего процесса.
 */
export const HELPERS_QUIET_MS = 30 * 60 * 1000

/**
 * Через сколько после Select ход, который не остановился, снимается вместе с процессом:
 * тот же запас, что у Stop в панели. Иначе вкладка осталась бы на покинутой подписке.
 */
export const FORCED_MOVE_MS = 8_000

/** Тег, в котором слова панели уходят агенту: по нему их узнаёт лента из транскрипта. */
export const CARRY_ON_TAG = 'panel-carry-on'
