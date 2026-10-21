/** Ключ документа редактора: файл в своём проекте. */
export const documentKey = (projectId: string, path: string): string => `${projectId}\n${path}`

const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff

/** Граница перед index режет символ: между \r и \n или внутри суррогатной пары. */
const splitsChar = (text: string, index: number) =>
  (text[index - 1] === '\r' && text[index] === '\n') || isLowSurrogate(text.charCodeAt(index))

/**
 * Где старый текст расходится с новым: общее начало и общий конец не трогаются. Правку
 * с диска редактор вставляет только в середину - курсор и прокрутка выше и ниже неё
 * остаются на месте, а шаг отмены возвращает ровно её. Граница не режет пару \r\n и
 * суррогатную пару: половина символа сместила бы позиции.
 */
export const changedSpan = (
  before: string,
  after: string,
): { start: number; oldEnd: number; newEnd: number } => {
  const limit = Math.min(before.length, after.length)
  let start = 0

  while (start < limit && before.charCodeAt(start) === after.charCodeAt(start)) start += 1
  while (start > 0 && (splitsChar(before, start) || splitsChar(after, start))) start -= 1

  let tail = 0
  const sameAtEnd = () =>
    before.charCodeAt(before.length - 1 - tail) === after.charCodeAt(after.length - 1 - tail)

  while (tail < limit - start && sameAtEnd()) tail += 1
  while (
    tail > 0 &&
    (splitsChar(before, before.length - tail) || splitsChar(after, after.length - tail))
  )
    tail -= 1

  return { start, oldEnd: before.length - tail, newEnd: after.length - tail }
}

/**
 * Касается ли пачка изменений на диске файла: он сам в списке или папка над ним
 * (переименовали, удалили целиком). null - изменений слишком много, касается всех.
 */
export const isTouched = (path: string, changed: readonly string[] | null): boolean =>
  changed === null ||
  changed.some((changedPath) => path === changedPath || path.startsWith(`${changedPath}/`))

/** Какой перевод строки у текста: CRLF, LF или никакого (одна строка). */
export const eolOf = (text: string): '\r\n' | '\n' | null => {
  if (text.includes('\r\n')) return '\r\n'

  return text.includes('\n') ? '\n' : null
}

/**
 * Текст с переводами строк модели. Monaco держит один перевод на весь файл и приводит к
 * нему всё вставленное, поэтому текст с диска сравнивается с моделью только так.
 */
export const withEol = (text: string, eol: string): string => text.replace(/\r\n|\r|\n/g, eol)
