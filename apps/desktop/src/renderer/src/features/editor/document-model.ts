import type { editor } from 'monaco-editor/editor/editor.api.js'

import { languageOfPath } from '../../lib/syntax-languages.utils'
import { eolOf, withEol, changedSpan } from './documents.utils'
import { monaco } from './monaco-setup'

/** Модель файла проекта: язык - по имени файла, адрес - проект и путь. */
export const createDocumentModel = (projectId: string, path: string, text: string) =>
  monaco.editor.createModel(
    text,
    languageOfPath(path) ?? 'plaintext',
    monaco.Uri.from({ scheme: 'project', authority: projectId, path: `/${path}` }),
  )

/** Тот же ли текст в модели, что на диске, - с поправкой на перевод строк модели. */
export const holdsText = (model: editor.ITextModel, text: string): boolean =>
  model.getValue() === withEol(text, model.getEOL())

/**
 * Текст с диска - в модель. Перевод строк файла меняется вместе с ним (prettier перевёл
 * CRLF в LF - и модель тоже), иначе первая же правка вернула бы старые во весь файл.
 * Меняется только середина и отдельным шагом отмены: курсор выше и ниже правки на месте.
 */
export const putDiskText = (model: editor.ITextModel, text: string): void => {
  const eol = eolOf(text)

  model.pushStackElement()

  if (eol && model.getEOL() !== eol) {
    model.pushEOL(
      eol === '\r\n' ? monaco.editor.EndOfLineSequence.CRLF : monaco.editor.EndOfLineSequence.LF,
    )
  }

  const current = model.getValue()
  const next = withEol(text, model.getEOL())
  const { start, oldEnd, newEnd } = changedSpan(current, next)

  if (start !== oldEnd || start !== newEnd) {
    const range = monaco.Range.fromPositions(
      model.getPositionAt(start),
      model.getPositionAt(oldEnd),
    )

    model.pushEditOperations([], [{ range, text: next.slice(start, newEnd) }], () => null)
  }

  model.pushStackElement()
}
