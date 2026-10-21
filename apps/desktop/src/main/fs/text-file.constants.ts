/**
 * Больше редактор не открывает: Monaco держит файл целиком в памяти окна, и на 200 тысячах
 * строк (около 8 МБ) окно уже весит 440 МБ (замер ADR 0005). Предел с запасом сверху -
 * сгенерированный бандл ещё откроется, дамп базы уже нет.
 */
export const TEXT_FILE_MAX_BYTES = 20 * 1024 * 1024

/** Сколько байт с начала смотреть на ноль: как git - ноль в начале значит не текст. */
export const BINARY_SNIFF_BYTES = 8_000

/** Метка порядка байтов UTF-8: редакторы Windows ставят её в начало файла. */
export const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf])

/** Коды ошибок, которые значат «нет прав»: человеку - словами, а не текстом errno. */
export const DENIED_CODES: ReadonlySet<string> = new Set(['EACCES', 'EPERM', 'EROFS'])

/** Коды, которые значат «такого файла нет»: остальные сбои вкладку не закрывают. */
export const MISSING_CODES: ReadonlySet<string> = new Set(['ENOENT', 'ENOTDIR'])

/** Права файла без типа: их получает временный файл безопасной записи. */
export const PERMISSION_BITS = 0o7777
