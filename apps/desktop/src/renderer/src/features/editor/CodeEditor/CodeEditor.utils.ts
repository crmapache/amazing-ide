import type { FilePlace } from '../../../state/selection.store'
import type { PlaceModel, PlaceRange, ScrollbarProbe } from './CodeEditor.types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Текст в названной строке, без учёта регистра - как ищет поиск по тексту. */
const findInLine = (model: PlaceModel, line: number, find: string): PlaceRange | null => {
  const column = model.getLineContent(line).toLowerCase().indexOf(find.toLowerCase())

  return column < 0 || find === ''
    ? null
    : {
        startLineNumber: line,
        startColumn: column + 1,
        endLineNumber: line,
        endColumn: column + 1 + find.length,
      }
}

/**
 * Место из ссылки - диапазон в модели. Строки и колонки за краем файла прижимаются к
 * нему: файл могли укоротить после того, как модель назвала строку. Конец в FilePlace
 * включительно, у Monaco - нет. find без строки - первое такое место в файле (не нашлось -
 * null), find со строкой - совпадение в ней (найденное поиском по тексту).
 */
export const placeRange = (model: PlaceModel, place: FilePlace): PlaceRange | null => {
  if (place.find !== undefined && place.line === undefined) {
    const match = model.findMatches(place.find, false, false, true, null, false)[0]

    return match?.range ?? null
  }

  if (place.line === undefined) return null

  const lines = model.getLineCount()
  const line = clamp(place.line, 1, lines)
  const inLine = place.find === undefined ? null : findInLine(model, line, place.find)

  if (inLine) return inLine

  const column = clamp(place.column ?? 1, 1, model.getLineMaxColumn(line))

  if (place.endLine === undefined) {
    return { startLineNumber: line, startColumn: column, endLineNumber: line, endColumn: column }
  }

  const endLine = clamp(place.endLine, line, lines)
  const endMax = model.getLineMaxColumn(endLine)
  const endColumn = place.endColumn === undefined ? endMax : clamp(place.endColumn + 1, 1, endMax)

  return { startLineNumber: line, startColumn: column, endLineNumber: endLine, endColumn }
}

/**
 * Строки выделения, как их называет человек: выделение до начала следующей строки
 * (тройной клик, Shift+↓) эту строку не берёт - в ней ничего не выделено.
 */
export const selectionLines = (range: PlaceRange): { from: number; to: number } => ({
  from: range.startLineNumber,
  to:
    range.endColumn === 1 && range.endLineNumber > range.startLineNumber
      ? range.endLineNumber - 1
      : range.endLineNumber,
})

/** Системные полосы классические: дорожка занимает место в пробе. Накладные - нет. */
export const hasClassicScrollbars = (probe: ScrollbarProbe): boolean =>
  probe.offsetWidth > probe.clientWidth
