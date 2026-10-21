import type { DocumentNotice, DocumentStatus } from '../editor.types'
import type { FilePlace } from '../../../state/selection.store'

export type CodeEditorProps = {
  projectId: string
  /** Файл активной вкладки: путь от корня проекта. */
  path: string
  /** Где встать: строка, колонка, диапазон или текст строки. Нет - открыть как было. */
  place: FilePlace | undefined
  /** Активна ли вкладка файла: спрятанный за разницей редактор клавиатуру не берёт. */
  isActive: boolean
}

/** Диапазон Monaco: строки и колонки с 1, конец не включается. */
export type PlaceRange = {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

/** Что из модели нужно, чтобы найти место: число строк, длина строки, поиск текста. */
export type PlaceModel = {
  getLineCount: () => number
  getLineMaxColumn: (line: number) => number
  getLineContent: (line: number) => string
  findMatches: (
    search: string,
    searchOnlyEditableRange: boolean,
    isRegex: boolean,
    matchCase: boolean,
    wordSeparators: string | null,
    captureMatches: boolean,
  ) => { range: PlaceRange }[]
}

/** Проба системных полос прокрутки: элемент с прокруткой, ширина с дорожкой и без. */
export type ScrollbarProbe = { offsetWidth: number; clientWidth: number }

export type DocumentNoticeProps = { projectId: string; path: string; notice: DocumentNotice }

export type DocumentPlaceholderProps = { status: Exclude<DocumentStatus, { kind: 'text' }> }
