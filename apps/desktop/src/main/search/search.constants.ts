import { GIT_ENV_OVERRIDES } from '../git/git.constants'

/**
 * Больше путей окну не отдаём: список целиком едет через IPC и ранжируется в окне
 * на каждое нажатие. 50 тысяч - крупный монорепозиторий; дальше ищут уже по папкам.
 */
export const PROJECT_FILES_LIMIT = 50_000

/** Список файлов огромного репозитория собирается секунды, дольше - что-то не так. */
export const PROJECT_FILES_TIMEOUT_MS = 10_000

/** Столько совпадений человек ещё просматривает; остальное - уточнить запрос. */
export const TEXT_MATCHES_LIMIT = 500

/** Один файл (словарь, минифицированный бандл) не должен занять весь список. */
export const TEXT_MATCHES_PER_FILE_LIMIT = 20

/** Поиск идёт на каждое нажатие: дольше ждать результат никто не станет. */
export const TEXT_SEARCH_TIMEOUT_MS = 8_000

/** Сколько символов строки показать вокруг совпадения в минифицированном коде. */
export const PREVIEW_WINDOW_CHARS = 160

/** Обход без git: файлы крупнее - данные и сборки, а не код, который ищут глазами. */
export const FALLBACK_FILE_MAX_BYTES = 1024 * 1024

/** Как git: ноль в первых 8000 байтах - файл двоичный, искать в нём текст бессмысленно. */
export const BINARY_SNIFF_BYTES = 8_000

/** Сколько файлов и каталогов читать с диска одновременно при обходе без git. */
export const FS_CONCURRENCY = 32

/**
 * Каталоги, в которые обход без git не заходит, на любой глубине. В репозитории
 * это решает .gitignore, а без него берём то, что почти всегда сгенерировано или
 * скачано: служебное VCS, зависимости, сборки, кэши, виртуальные окружения и
 * настройки IDE. Их содержимое не ищут, а по объёму оно в разы больше кода.
 */
export const SKIPPED_DIRECTORY_NAMES: ReadonlySet<string> = new Set([
  // Служебное систем контроля версий.
  '.git',
  '.hg',
  '.svn',
  // Зависимости.
  'node_modules',
  // Сборки.
  'dist',
  'out',
  'build',
  'target',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  // Кэши инструментов.
  '.cache',
  '.parcel-cache',
  '.gradle',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  // Виртуальные окружения Python.
  '.venv',
  'venv',
  // Настройки IDE.
  '.idea',
])

/** Файлы, которые не ищутся и не показываются: служебный мусор Finder. */
export const SKIPPED_FILE_NAMES: ReadonlySet<string> = new Set(['.DS_Store'])

/**
 * Окружение git grep: как у остальных команд, но с UTF-8 вместо C. В локали C
 * `-i` складывает регистр только у латиницы, и «ПРИВЕТ» не находит «привет».
 */
export const GIT_GREP_ENV = { ...GIT_ENV_OVERRIDES, LC_ALL: 'en_US.UTF-8' }

/**
 * Сколько байт строки из git grep держать для превью. Превью - 160 символов, а
 * строка source map или бандла бывает в десятки мегабайт; совпадение дальше этого
 * показывается строкой без подсветки.
 */
export const GREP_FIELD_MAX_BYTES = 64 * 1024

/** Код выхода git на неизвестную опцию: --max-count появился только в git 2.38. */
export const GIT_USAGE_ERROR_EXIT_CODE = 129

/** Разделитель записей `git ls-files -z` (см. RecordReader). */
export const LS_FILES_DELIMITERS: readonly number[] = [0]

/** Поля строки `git grep -z -n`: путь\0номер\0текст\n. */
export const GREP_DELIMITERS: readonly number[] = [0, 0, 0x0a]

/** Режимы записей индекса git: подмодуль - это каталог, ссылка может вести куда угодно. */
export const GIT_GITLINK_MODE = '160000'
export const GIT_SYMLINK_MODE = '120000'
