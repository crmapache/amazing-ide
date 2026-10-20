/** Описание плагина в каталоге: на экране всё равно две строки, а каталог - тысячи плагинов. */
export const DESCRIPTION_MAX_CHARS = 240

/** Разовая команда CLI (список, удаление): дольше - что-то не так. */
export const CLI_COMMAND_TIMEOUT_MS = 60_000

/** Установка плагина клонирует репозиторий - ей дают больше. */
export const PLUGIN_INSTALL_TIMEOUT_MS = 180_000

/** Чем заменяется ключ в том, что уходит в окно. */
export const SECRET_MASK = '•••'

/** Имя флага или переменной, значение которых - ключ: --api-key, API_TOKEN=, password. */
export const SECRET_NAME = /(key|token|secret|passw(or)?d|auth|credential|bearer)/i

/**
 * Ключ сам по себе, без имени рядом: известные префиксы (OpenAI, GitHub, Slack, GitLab,
 * AWS) или длинная строка букв и цифр вперемешку - так выглядят ключи в пути адреса.
 */
export const SECRET_VALUE =
  /^(sk-|sk_|ghp_|gho_|ghs_|github_pat_|xox[abpr]-|glpat-|AKIA)[\w-]{12,}$|^(?=.*\d)(?=.*[A-Za-z])[\w-]{24,}$/
