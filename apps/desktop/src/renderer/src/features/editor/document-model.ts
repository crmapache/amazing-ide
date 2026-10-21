import type { editor } from 'monaco-editor/editor/editor.api.js'

import { languageOfPath } from '../../lib/syntax-languages.utils'
import { eolOf, withEol, changedSpan } from './documents.utils'
import { monaco } from './monaco-setup'

/**
 * Модель файла проекта: язык - по имени файла, адрес - проект и путь. Схема file, как у
 * файлов в VS Code: закрытой модели Monaco хранит историю отмены и отдаёт её модели с тем же
 * адресом и тем же текстом. Разница перешла к другому файлу и вернулась, вкладку закрыли и
 * открыли - ⌘Z возвращает правки; файл за это время поменяли - история уже не к нему.
 */
export const createDocumentModel = (projectId: string, path: string, text: string) =>
  monaco.editor.createModel(
    text,
    languageOfPath(path) ?? 'plaintext',
    monaco.Uri.from({ scheme: 'file', authority: projectId, path: `/${path}` }),
  )

/** Тот же ли текст в модели, что на диске, - с поправкой на перевод строк модели. */
export const holdsText = (model: editor.ITextModel, text: string): boolean =>
  model.getValue() === withEol(text, model.getEOL())

/**
 * Новый текст - в модель: с диска - в документ, из нового коммита - в левую сторону
 * разницы. Перевод строк меняется вместе с текстом (prettier перевёл CRLF в LF - и модель
 * тоже), иначе первая же правка вернула бы старые во весь файл. Меняется только середина и
 * отдельным шагом отмены: курсор, свёрнутое и метки Monaco выше и ниже правки на месте.
 */
export const putText = (model: editor.ITextModel, text: string): void => {
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
