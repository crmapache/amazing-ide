/** Локальные команды git: дольше этого - что-то не так, а шапка ждёт. */
export const GIT_LOCAL_TIMEOUT_MS = 5_000

/** Обмен с удалённым репозиторием (pull, push): сеть бывает медленной. */
export const GIT_NETWORK_TIMEOUT_MS = 2 * 60 * 1000

/** Клонирование большого репозитория - это минуты. */
export const GIT_CLONE_TIMEOUT_MS = 30 * 60 * 1000

/** Сколько строк ответа git показывать человеку, если действие не удалось. */
export const GIT_DETAILS_MAX_LINES = 8

/** Сколько stderr потоковой команды держать для журнала: хвост ошибки не нужен. */
export const GIT_STDERR_KEEP_CHARS = 4_000

/**
 * Окружение для git: без вопросов в терминал (их некому показать) и с английским
 * выводом, который мы разбираем. Пароли и токены берёт хранилище ключей macOS через
 * credential helper, если он настроен; иначе git честно откажет.
 */
export const GIT_ENV_OVERRIDES = { GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' }
